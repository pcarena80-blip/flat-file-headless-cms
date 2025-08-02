const axios = require('axios');

class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = process.env.GITHUB_TOKEN;
        this.owner = process.env.GITHUB_OWNER;
        this.repo = process.env.GITHUB_REPO;
        this.branch = process.env.GITHUB_BRANCH || 'main';
    }

    // Get GitHub API headers
    getHeaders() {
        return {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    // Create or update a file on GitHub
    async createOrUpdateFile(path, content, message) {
        try {
            // First, try to get the current file to get its SHA
            let sha = null;
            try {
                const response = await axios.get(
                    `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
                    { headers: this.getHeaders() }
                );
                sha = response.data.sha;
            } catch (error) {
                // File doesn't exist, that's okay
            }

            const data = {
                message: message,
                content: Buffer.from(content).toString('base64'),
                branch: this.branch
            };

            if (sha) {
                data.sha = sha;
            }

            const response = await axios.put(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
                data,
                { headers: this.getHeaders() }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('GitHub API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Get file content from GitHub
    async getFile(path) {
        try {
            const response = await axios.get(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
                { headers: this.getHeaders() }
            );
            
            const content = Buffer.from(response.data.content, 'base64').toString('utf8');
            return {
                success: true,
                content: content
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // List files in a directory
    async listFiles(path = '') {
        try {
            const response = await axios.get(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
                { headers: this.getHeaders() }
            );
            
            return {
                success: true,
                files: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Delete a file from GitHub
    async deleteFile(path, message) {
        try {
            // First get the file to get its SHA
            const fileResponse = await axios.get(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
                { headers: this.getHeaders() }
            );

            const data = {
                message: message,
                sha: fileResponse.data.sha,
                branch: this.branch
            };

            const response = await axios.delete(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
                {
                    headers: this.getHeaders(),
                    data: data
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = GitHubAPI; 
