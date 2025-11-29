# 🚀 Push to GitHub

## Quick Setup

Since GitHub CLI is not installed, follow these steps:

### 1. Create Repository on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `UniWeek`
3. Description: `University Event Management App - React Native app for Student Week`
4. Choose **Public** (or Private if preferred)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

### 2. Push Your Code

After creating the repo, GitHub will show you commands. Use these:

```powershell
# If your GitHub username is different, replace it:
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/UniWeek.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Share with Your Partner

Once pushed, share this link with your partner:
```
https://github.com/YOUR_USERNAME/UniWeek
```

They can clone it with:
```bash
git clone https://github.com/YOUR_USERNAME/UniWeek.git
cd UniWeek
npm install
```

---

## Alternative: Using GitHub Desktop

1. Download [GitHub Desktop](https://desktop.github.com/)
2. File → Add Local Repository → Select `E:\University\VISIO SPARK`
3. Click "Publish repository"
4. Name it "UniWeek"
5. Click "Publish Repository"

---

## Current Status

✅ Git initialized  
✅ All files committed (46 files, 18,975 lines)  
✅ Ready to push  

**Commit Message:**
```
Initial commit: UniWeek Event Management App
- Complete Expo React Native project with Supabase integration
- TypeScript, role-based navigation for students and societies
```

**What's Included:**
- 46 files
- Complete app structure
- All screens and components
- Supabase integration
- TypeScript configuration
- Documentation (README, SETUP_COMPLETE, STATUS)
