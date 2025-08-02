const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GitHubAPI = require('./github-api');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const githubAPI = new GitHubAPI();
        const { email, password, action } = JSON.parse(event.body || '{}');

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email and password are required' })
            };
        }

        // Sanitize email for filename
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
        const userFilePath = `users/${safeEmail}.md`;

        if (action === 'signup') {
            // Check if user already exists
            const existingUser = await githubAPI.getFile(userFilePath);
            if (existingUser.success) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'User already exists' })
                };
            }

            // Create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = {
                email: email,
                password: hashedPassword,
                role: 'user',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            // Create user markdown file
            const userContent = `---
email: "${email}"
password: "${hashedPassword}"
role: "user"
createdAt: "${userData.createdAt}"
lastLogin: "${userData.lastLogin}"
---

# User Profile: ${email}

## Account Information
- **Email**: ${email}
- **Role**: ${userData.role}
- **Created**: ${userData.createdAt}
- **Last Login**: ${userData.lastLogin}

## Account Details
This user account was created through the flat-file headless CMS system.

All data is stored directly on GitHub as markdown files for easy version control and backup.
`;

            const result = await githubAPI.createOrUpdateFile(
                userFilePath,
                userContent,
                `Add new user: ${email}`
            );

            if (!result.success) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Failed to create user account' })
                };
            }

            // Generate token for new user
            const token = jwt.sign(
                { 
                    email: userData.email, 
                    role: userData.role,
                    userId: userData.email 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    token,
                    user: {
                        email: userData.email,
                        role: userData.role
                    },
                    message: 'User account created successfully'
                })
            };

        } else {
            // Login existing user
            const userFile = await githubAPI.getFile(userFilePath);
            
            if (!userFile.success) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            // Parse user data from markdown file
            const userContent = userFile.content;
            const userData = parseUserFromMarkdown(userContent);

            if (!userData) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid user data format' })
                };
            }

            const isValidPassword = await bcrypt.compare(password, userData.password);
            
            if (!isValidPassword) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            // Update last login time
            userData.lastLogin = new Date().toISOString();
            const updatedContent = updateUserMarkdown(userContent, userData);

            await githubAPI.createOrUpdateFile(
                userFilePath,
                updatedContent,
                `Update last login for: ${email}`
            );

            const token = jwt.sign(
                { 
                    email: userData.email, 
                    role: userData.role,
                    userId: userData.email 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    token,
                    user: {
                        email: userData.email,
                        role: userData.role
                    }
                })
            };
        }

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Helper function to parse user data from markdown
function parseUserFromMarkdown(content) {
    try {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontMatterMatch) return null;

        const frontMatter = frontMatterMatch[1];
        const userData = {};

        frontMatter.split('\n').forEach(line => {
            const [key, value] = line.split(': ');
            if (key && value) {
                userData[key.trim()] = value.replace(/"/g, '');
            }
        });

        return userData;
    } catch (error) {
        console.error('Error parsing user markdown:', error);
        return null;
    }
}

// Helper function to update user markdown
function updateUserMarkdown(content, userData) {
    const frontMatter = `---
email: "${userData.email}"
password: "${userData.password}"
role: "${userData.role}"
createdAt: "${userData.createdAt}"
lastLogin: "${userData.lastLogin}"
---`;

    const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
    const body = bodyMatch ? bodyMatch[1] : '';

    return `${frontMatter}\n\n${body}`;
} 
