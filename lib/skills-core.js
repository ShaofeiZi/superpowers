import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 从 skill 文件中提取 YAML frontmatter。
 * 当前格式：
 * ---
 * name: skill-name
 * description: Use when [condition] - [what it does]
 * ---
 *
 * @param {string} filePath - SKILL.md 文件的路径
 * @returns {{name: string, description: string}}
 */
function extractFrontmatter(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        let inFrontmatter = false;
        let name = '';
        let description = '';

        for (const line of lines) {
            if (line.trim() === '---') {
                if (inFrontmatter) break;
                inFrontmatter = true;
                continue;
            }

            if (inFrontmatter) {
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    switch (key) {
                        case 'name':
                            name = value.trim();
                            break;
                        case 'description':
                            description = value.trim();
                            break;
                    }
                }
            }
        }

        return { name, description };
    } catch (error) {
        return { name: '', description: '' };
    }
}

/**
 * 在目录中递归查找所有 SKILL.md 文件。
 *
 * @param {string} dir - 要搜索的目录
 * @param {string} sourceType - 用于命名空间的 'personal' 或 'superpowers'
 * @param {number} maxDepth - 最大递归深度（默认值：3）
 * @returns {Array<{path: string, name: string, description: string, sourceType: string}>}
 */
function findSkillsInDir(dir, sourceType, maxDepth = 3) {
    const skills = [];

    if (!fs.existsSync(dir)) return skills;

    function recurse(currentDir, depth) {
        if (depth > maxDepth) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // Check for SKILL.md in this directory
                const skillFile = path.join(fullPath, 'SKILL.md');
                if (fs.existsSync(skillFile)) {
                    const { name, description } = extractFrontmatter(skillFile);
                    skills.push({
                        path: fullPath,
                        skillFile: skillFile,
                        name: name || entry.name,
                        description: description || '',
                        sourceType: sourceType
                    });
                }

                // Recurse into subdirectories
                recurse(fullPath, depth + 1);
            }
        }
    }

    recurse(dir, 0);
    return skills;
}

/**
 * 将 skill 名称解析为文件路径，处理遮蔽问题
 *（个人 skills 会覆盖 superpowers skills）。
 *
 * @param {string} skillName - 类似于 "superpowers:brainstorming" 或 "my-skill" 的名称
 * @param {string} superpowersDir - superpowers skills 目录的路径
 * @param {string} personalDir - 个人 skills 目录的路径
 * @returns {{skillFile: string, sourceType: string, skillPath: string} | null}
 */
function resolveSkillPath(skillName, superpowersDir, personalDir) {
    // 如果存在 superpowers: 前缀，则去除
    const forceSuperpowers = skillName.startsWith('superpowers:');
    const actualSkillName = forceSuperpowers ? skillName.replace(/^superpowers:/, '') : skillName;

    // 首先尝试个人 skills（除非明确指定为 superpowers:）
    if (!forceSuperpowers && personalDir) {
        const personalPath = path.join(personalDir, actualSkillName);
        const personalSkillFile = path.join(personalPath, 'SKILL.md');
        if (fs.existsSync(personalSkillFile)) {
            return {
                skillFile: personalSkillFile,
                sourceType: 'personal',
                skillPath: actualSkillName
            };
        }
    }

    // 尝试 superpowers skills
    if (superpowersDir) {
        const superpowersPath = path.join(superpowersDir, actualSkillName);
        const superpowersSkillFile = path.join(superpowersPath, 'SKILL.md');
        if (fs.existsSync(superpowersSkillFile)) {
            return {
                skillFile: superpowersSkillFile,
                sourceType: 'superpowers',
                skillPath: actualSkillName
            };
        }
    }

    return null;
}

/**
 * 检查 git 仓库是否有可用的更新。
 *
 * @param {string} repoDir - git 仓库的路径
 * @returns {boolean} - 如果有可用更新则返回 true
 */
function checkForUpdates(repoDir) {
    try {
        // 快速检查，超时 3 秒，避免网络问题时造成延迟
        const output = execSync('git fetch origin && git status --porcelain=v1 --branch', {
            cwd: repoDir,
            timeout: 3000,
            encoding: 'utf8',
            stdio: 'pipe'
        });

        // 解析 git status 输出，查看是否落后于远程
        const statusLines = output.split('\n');
        for (const line of statusLines) {
            if (line.startsWith('## ') && line.includes('[behind ')) {
                return true; // 落后于远程
            }
        }
        return false; // 已更新
    } catch (error) {
        // 网络断开、git 错误、超时等 - 不阻塞引导过程
        return false;
    }
}

/**
 * 从 skill 内容中剥离 YAML frontmatter，只返回内容部分。
 *
 * @param {string} content - 包含 frontmatter 的完整内容
 * @returns {string} - 去除 frontmatter 后的内容
 */
function stripFrontmatter(content) {
    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterEnded = false;
    const contentLines = [];

    for (const line of lines) {
        if (line.trim() === '---') {
            if (inFrontmatter) {
                frontmatterEnded = true;
                continue;
            }
            inFrontmatter = true;
            continue;
        }

        if (frontmatterEnded || !inFrontmatter) {
            contentLines.push(line);
        }
    }

    return contentLines.join('\n').trim();
}

export {
    extractFrontmatter,
    findSkillsInDir,
    resolveSkillPath,
    checkForUpdates,
    stripFrontmatter
};
