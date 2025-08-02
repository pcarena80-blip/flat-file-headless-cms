# 📚 Simple Flat-File Headless CMS

A simple flat-file headless CMS that stores everything on GitHub as .md files.

## �� Quick Setup

1. **Upload to GitHub**
   - Create a new repository on GitHub
   - Upload all files to the repository

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm install`
   - Set publish directory: `public`

3. **Set Environment Variables in Netlify**
   ```
   GITHUB_TOKEN=your_github_token
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=your_repository_name
   JWT_SECRET=any_random_string
   ```

4. **Get GitHub Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` permission
   - Copy the token

5. **Start Using**
   - Go to your Netlify URL
   - Click "Admin Panel"
   - Sign up and start creating blogs!

## 📁 File Structure
