<div align="center">

# 🌐 Technex Hackathon — IIT (BHU) Varanasi
 **Youtube Video link for you project overview:** 
https://youtu.be/ubkq3JCjsDA

**The official hackathon website for Technex, the annual techno-management fest of IIT (BHU) Varanasi.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Railway](https://img.shields.io/badge/Deployed_on-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)

</div>

---

## 📌 Overview


This is the hackathon project built for **Technex, IIT (BHU) Varanasi**  a climate intelligence platform that combines time series forecasting with rich, interactive data visualization to make sense of our changing planet.

At its core, the platform predicts climate data using machine learning-powered time series models and brings those predictions to life through dynamic graphs and interactive animations. The centerpiece is an **interactive 3D globe** that renders global climate heatmaps in real time, letting users literally spin the Earth and watch climate patterns unfold across regions.

Beyond the globe, the platform offers three powerful analytical tools:
- 🏔️ **Landscape Analyzer** — examine climate behavior across different terrain and geographic regions
- 🔮 **Future Predictor** — project climate trends forward using forecasting models, giving a data-driven glimpse into what lies ahead
- 🗺️ **Intensity Map** — visualize the severity and distribution of climate events across the world

The platform is thoughtfully split into **two distinct experiences** — one tailored for **researchers** who need depth, raw data, and analytical precision, and another for **enthusiasts** who want an accessible, visually engaging way to explore climate change without the technical overhead.

It's built to be as informative as it is beautiful — because understanding the climate crisis shouldn't require a PhD.
---

## 🗂️ Project Structure

```
FINAL_BHU/
├── frontend/          # Main frontend application (TypeScript + HTML/CSS)
├── globe/             # Interactive 3D globe visualization module
├── predictor_dir/     # Python-based ML prediction service
├── DEPLOYMENT_GUIDE.md
├── railway.json       # Railway deployment configuration
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | TypeScript, HTML5, CSS3, JavaScript |
| **Visualization** | Custom 3D Globe (WebGL / Canvas) |
| **Backend / ML** | Python (Predictor Service) |
| **Deployment** | Railway |
| **Version Control** | Git & GitHub |

---

## ✨ Features

- 🌍 **Interactive Globe** — Immersive 3D globe visualization highlighting participant locations worldwide
- 🤖 **Predictor Module** — Python-powered ML service for hackathon insights and predictions
- 🎨 **Responsive UI** — Fully responsive frontend crafted in TypeScript with modern CSS
- 📋 **Hackathon Info** — Problem statements, timelines, prizes, and team registration details
- 🚀 **Railway Deployment** — Seamless cloud deployment with `railway.json` configuration

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/Monarchy712/FINAL_BHU.git
cd FINAL_BHU
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Globe Module

```bash
cd globe
npm install
npm run dev
```

#### Predictor Service (Python)

```bash
cd predictor_dir
pip install -r requirements.txt
python app.py
```

---

## ☁️ Deployment

This project is configured for deployment on **[Railway](https://railway.app/)**.

Refer to [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for detailed step-by-step deployment instructions.

```bash
# Deploy via Railway CLI
railway up
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is maintained by the **Technex team, IIT (BHU) Varanasi**.  
All rights reserved © Technex, IIT BHU.

---

<div align="center">

Made with ❤️ by the Technex Tech Team · [IIT (BHU) Varanasi](https://iitbhu.ac.in/) · Hackathon Division

</div>
