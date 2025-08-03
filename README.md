# 📚 Simple Flat-File Headless CMS

A simple flat-file headless CMS that stores everything on GitHub as .md files, featuring a modern dashboard inspired by Vuexy design.

## 🚀 Quick Setup

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

## 🎯 Features

### 📊 Modern Dashboard
- **Statistics Cards**: Total posts, published posts, drafts, views
- **Performance Chart**: Visual analytics of blog performance
- **Recent Posts Table**: Quick management of all posts
- **Modern UI**: Inspired by Vuexy dashboard design
- **Responsive Design**: Works on all devices

### 📝 Blog Management
- **Create/Edit Posts**: Rich markdown editor
- **Excerpt Support**: SEO-friendly post summaries
- **Tags System**: Organize content with tags
- **Featured Posts**: Highlight important content
- **Status Management**: Draft and published states

### 🔐 User Management
- **Secure Authentication**: JWT-based login system
- **User Profiles**: Email-based user accounts
- **Admin Panel**: Full content management interface

### 📁 GitHub Storage
- **Version Control**: All changes tracked in Git
- **No Database**: Everything stored as markdown files
- **Backup**: Automatic backup to GitHub repository

## 📁 File Structure

```
├── functions/          # API functions
│   ├── auth.js        # Authentication
│   ├── blogs.js       # Blog management
│   └── github-api.js  # GitHub API integration
├── public/            # Website files
│   ├── index.html     # Homepage
│   ├── post.html      # Individual blog posts
│   └── admin/         # Admin panel
│       ├── index.html # Blog management
│       └── dashboard.html # Modern dashboard
├── package.json       # Dependencies
├── netlify.toml       # Netlify config
└── README.md          # This file
```

## 🎨 Dashboard Features

### Statistics Overview
- **Total Blog Posts**: Count of all posts
- **Published Posts**: Live posts count
- **Draft Posts**: Work in progress
- **Total Views**: Engagement metrics

### Performance Analytics
- **Line Chart**: Posts published over time
- **Views Trend**: Reader engagement
- **Export Data**: Download analytics

### Quick Actions
- **View Posts**: Open in new tab
- **Edit Posts**: Modify content
- **Delete Posts**: Remove content
- **Create New**: Add new posts

## 🔧 How It Works

- **Users**: Stored as `users/email@example.com.md` on GitHub
- **Blogs**: Stored as `blogs/blog-title.md` on GitHub
- **No Database**: Everything is markdown files on GitHub
- **Version Control**: All changes tracked in Git

## 🚀 Access Dashboard

1. **Login to Admin Panel**
2. **Click "📊 Dashboard" button**
3. **View your blog analytics**
4. **Manage posts from the table**

## 🎯 Demo Blogs

The system includes two demo blog posts:
- **Welcome to Your CMS**: Complete setup guide
- **Getting Started with Markdown**: Writing tutorial

## 🔧 Technical Details

### Environment Variables
Make sure these are set in Netlify:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `GITHUB_OWNER`: Your GitHub username
- `GITHUB_REPO`: Your repository name
- `GITHUB_BRANCH`: Your repository branch (usually `main`)
- `JWT_SECRET`: A secret key for JWT signing

### API Endpoints
- `/.netlify/functions/auth`: User authentication
- `/.netlify/functions/blogs`: Blog management
- `/.netlify/functions/blogs?action=stats`: Dashboard statistics

## 🎨 Customization

### Dashboard Colors
The dashboard uses a purple theme inspired by Vuexy:
- Primary: `#667eea`
- Secondary: `#764ba2`
- Success: `#28a745`
- Warning: `#ffc107`
- Info: `#17a2b8`

### Adding Features
- **Comments**: Add comment system
- **Categories**: Implement category management
- **Analytics**: Integrate Google Analytics
- **SEO**: Add meta tags and sitemap

That's it! Simple and clean. 🎉 
