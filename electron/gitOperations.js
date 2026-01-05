import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Execute a git command in the specified directory
 */
async function execGit(repoPath, args) {
  try {
    const { stdout, stderr } = await execAsync(`git ${args}`, {
      cwd: repoPath,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { success: false, error: error.message, stderr: error.stderr?.trim() };
  }
}

/**
 * Check if a path is a valid git repository
 */
export async function isGitRepo(repoPath) {
  const result = await execGit(repoPath, 'rev-parse --git-dir');
  return result.success;
}

/**
 * Get repository information
 */
export async function getRepoInfo(repoPath) {
  const isRepo = await isGitRepo(repoPath);
  if (!isRepo) {
    return { success: false, error: 'Not a git repository' };
  }

  // Get current branch
  const branchResult = await execGit(repoPath, 'branch --show-current');
  const currentBranch = branchResult.success ? branchResult.stdout : 'HEAD';

  // Get remote URL (if exists)
  const remoteResult = await execGit(repoPath, 'remote get-url origin');
  const remoteUrl = remoteResult.success ? remoteResult.stdout : null;

  // Get repo name from path
  const repoName = path.basename(repoPath);

  return {
    success: true,
    data: {
      path: repoPath,
      name: repoName,
      currentBranch,
      remoteUrl,
    }
  };
}

/**
 * List all branches (local and remote)
 */
export async function listBranches(repoPath) {
  const isRepo = await isGitRepo(repoPath);
  if (!isRepo) {
    return { success: false, error: 'Not a git repository' };
  }

  // Get local branches
  const localResult = await execGit(repoPath, 'branch --format="%(refname:short)"');
  const localBranches = localResult.success
    ? localResult.stdout.split('\n').filter(b => b)
    : [];

  // Get remote branches
  const remoteResult = await execGit(repoPath, 'branch -r --format="%(refname:short)"');
  const remoteBranches = remoteResult.success
    ? remoteResult.stdout.split('\n')
        .filter(b => b && !b.includes('HEAD'))
        .map(b => b.replace(/^origin\//, ''))
    : [];

  // Combine and deduplicate
  const allBranches = [...new Set([...localBranches, ...remoteBranches])];

  return {
    success: true,
    data: {
      local: localBranches,
      remote: remoteBranches,
      all: allBranches,
    }
  };
}

/**
 * List all worktrees
 */
export async function listWorktrees(repoPath) {
  const isRepo = await isGitRepo(repoPath);
  if (!isRepo) {
    return { success: false, error: 'Not a git repository' };
  }

  const result = await execGit(repoPath, 'worktree list --porcelain');
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Parse porcelain output
  const worktrees = [];
  const blocks = result.stdout.split('\n\n').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split('\n');
    const worktree = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        worktree.path = line.substring(9);
      } else if (line.startsWith('HEAD ')) {
        worktree.head = line.substring(5);
      } else if (line.startsWith('branch ')) {
        worktree.branch = line.substring(7).replace('refs/heads/', '');
      } else if (line === 'bare') {
        worktree.bare = true;
      } else if (line === 'detached') {
        worktree.detached = true;
      } else if (line.startsWith('locked')) {
        worktree.locked = true;
      } else if (line.startsWith('prunable')) {
        worktree.prunable = true;
      }
    }

    if (worktree.path) {
      worktree.name = path.basename(worktree.path);
      worktree.isMain = worktree.path === repoPath;
      worktrees.push(worktree);
    }
  }

  return { success: true, data: worktrees };
}

/**
 * Create a new worktree
 */
export async function createWorktree(repoPath, branch, targetPath, createBranch = false) {
  const isRepo = await isGitRepo(repoPath);
  if (!isRepo) {
    return { success: false, error: 'Not a git repository' };
  }

  // Ensure target directory's parent exists
  const parentDir = path.dirname(targetPath);
  try {
    await fs.mkdir(parentDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  // Build command
  let command = `worktree add "${targetPath}"`;
  if (createBranch) {
    command += ` -b ${branch}`;
  } else {
    command += ` ${branch}`;
  }

  const result = await execGit(repoPath, command);
  if (!result.success) {
    return { success: false, error: result.stderr || result.error };
  }

  return {
    success: true,
    data: {
      path: targetPath,
      branch,
      name: path.basename(targetPath),
    }
  };
}

/**
 * Remove a worktree
 */
export async function removeWorktree(repoPath, worktreePath, force = false) {
  const isRepo = await isGitRepo(repoPath);
  if (!isRepo) {
    return { success: false, error: 'Not a git repository' };
  }

  const command = force
    ? `worktree remove --force "${worktreePath}"`
    : `worktree remove "${worktreePath}"`;

  const result = await execGit(repoPath, command);
  if (!result.success) {
    return { success: false, error: result.stderr || result.error };
  }

  return { success: true };
}

/**
 * Prune stale worktree references
 */
export async function pruneWorktrees(repoPath) {
  const isRepo = await isGitRepo(repoPath);
  if (!isRepo) {
    return { success: false, error: 'Not a git repository' };
  }

  const result = await execGit(repoPath, 'worktree prune');
  if (!result.success) {
    return { success: false, error: result.stderr || result.error };
  }

  return { success: true };
}

/**
 * Get the default worktrees directory path
 */
export function getWorktreesDir(repoPath) {
  return path.join(path.dirname(repoPath), `${path.basename(repoPath)}-worktrees`);
}

/**
 * Generate a worktree path for a branch
 */
export function generateWorktreePath(repoPath, branchName) {
  const worktreesDir = getWorktreesDir(repoPath);
  // Sanitize branch name for filesystem
  const safeName = branchName.replace(/[\/\\:*?"<>|]/g, '-');
  return path.join(worktreesDir, safeName);
}
