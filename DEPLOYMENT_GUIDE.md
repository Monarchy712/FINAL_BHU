# Deployment Guide: Uploading to Railway

This guide explains how to deploy the **FINAL_BHU** project to Railway while excluding the large `.nc` files.

## Prerequisites
1. A [Railway](https://railway.app/) account.
2. [Railway CLI](https://docs.railway.app/develop/cli) installed (optional but recommended).
3. Your project is initialized as a Git repository.

## Step 1: Prepare the Repository
I have already updated your `.gitignore` to exclude the large `.nc` files. To verify, run:
```bash
git status
```
Make sure no `.nc` files are listed under "Untracked files".

## Step 2: Push to GitHub/GitLab
Create a new private repository on GitHub and push your code:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 3: Deploy to Railway
1. Log in to your [Railway Dashboard](https://railway.app/dashboard).
2. Click **+ New Project** > **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will automatically detect the **Dockerfile** and start the build process.

> [!NOTE]
> I have switched the deployment to use a **Dockerfile**. This ensures that both your React frontend and FastAPI backend are built correctly and linked together in the production image.

## Step 4: Configure Environment Variables
In the Railway dashboard, go to the **Variables** tab for your service and add:
- `GROQ_API_KEY`: Your Groq API key from `.env`.
- `PORT`: `8000` (Railway usually provides this automatically).

## Step 5: Handling .nc Files (Optional)
Since `.nc` files are excluded from Git:
- **Story Mode** and **Guided Tour** will work (using fallback values or geocoding).
- **Intensity Map** will show a "Missing Data" error.
- **To enable these features**: Use a **Railway Volume** or external cloud storage (like AWS S3) to host the `.nc` files and update the paths in `main.py` to point to the Volume mount point.

## Troubleshooting
If the app fails to start, check the **Deploy Logs** in Railway. Common issues include missing dependencies (which should be handled by `requirements.txt`).
