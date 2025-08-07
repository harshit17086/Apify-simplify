# Apify Web Challenge

A futuristic web application for managing and executing Apify actors with a modern, intuitive interface.

## 🚀 Features

- **Futuristic UI**: Modern, dark-themed interface with animations and visual effects
- **Actor Management**: Browse and select your Apify actors
- **Smart Configuration**: Automatic schema detection with fallback to manual input
- **Real-time Results**: View and analyze actor execution results
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Apify API Key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apify-web-challenge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! No additional setup required. The application is ready to use.

## 🔑 Getting Your Apify API Key

1. Go to [Apify Console](https://console.apify.com/)
2. Sign in or create an account
3. Navigate to **Account Settings** → **Integrations** → **API tokens**
4. Create a new API token
5. Copy the token for use in the application

## 🤖 Custom Apify Actor

The application is designed to work with custom Apify actors. Here's an example of the actor code used:

```javascript
import { Actor } from 'apify';

await Actor.init();

const { url } = await Actor.getInput();
const body = await fetch(url).then(res => res.text());
await Actor.pushData({ html: body });

await Actor.exit();
```

This actor:
- Fetches a URL from the input
- Retrieves the HTML content
- Returns the data in a structured format

## 🔧 Schema Handling

The application intelligently handles actors with or without defined input schemas:

### With Schema
- Automatically detects input parameters
- Provides appropriate input fields (text, number, boolean, select)
- Validates input based on schema requirements

### Without Schema (Custom Parameters)
When an actor doesn't have a defined schema, the application provides manual input options:

- **Website URL**: Direct URL input for scraping
- **Start URLs**: JSON array format for multiple starting points
- **Additional Input**: Custom JSON parameters for advanced configuration

Example manual input:
```json
{
  "url": "https://example.com",
  "startUrls": "[{\"url\": \"https://example.com\"}]",
  "additionalInput": "{\"maxPages\": 10, \"waitFor\": 2000}"
}
```

## 🔄 Workflow

### 1. Landing Page
- Futuristic welcome screen
- Click "Continue to Dashboard" to proceed

### 2. Authentication
- Enter your Apify API key
- Click "Fetch My Actors" to authenticate

### 3. Actor Selection
- Browse your available actors in a tabular format
- Click on an actor to configure it

### 4. Configuration
- **With Schema**: Automatic form generation based on actor schema
- **Without Schema**: Manual input fields for URL and parameters

### 5. Execution
- Click "Run Actor" to execute
- Monitor real-time status updates

### 6. Results
- View execution results in a structured format
- HTML content with preview/source/formatted tabs
- Export or analyze results

## 🎨 UI Features

### Landing Page
- Animated background with floating elements
- Gradient text effects
- Smooth transitions and hover effects

### Authentication Page
- Clean, modern sign-in interface
- Secure API key input
- Loading states and error handling

### Actor Dashboard
- Tabular layout for actor selection
- Status indicators and metadata
- Responsive grid design

### Results Page
- Dark theme with futuristic styling
- HTML content preview with iframe
- Expandable content sections
- Multiple view modes (preview, source, formatted)

## 🛡️ Security

- API keys are handled securely
- No sensitive data is stored locally
- All requests are made server-side

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. Add environment variables if needed

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+


## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Apify API key is correct
3. Ensure your actors are properly configured
4. Check the network tab for API request failures

---

**Built with Next.js, React, and TypeScript**
