# GitHub UI - Spec Editor

A Vue.js web application that connects to GitHub for editing specification files in repositories.

## Features

- **GitHub Authentication**: Secure login using GitHub Personal Access Tokens
- **Repository Access**: Enter GitHub username/organization and repository name
- **File Explorer**: Browse spec files from the configured spec directory
- **External Specs Manager**: Manage external specification references in specs.json
- **WYSIWYG Editor**: Simple editor with basic formatting options
- **Live Preview**: Preview markdown files as you edit
- **Git Integration**: Save changes directly to GitHub with commit messages

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- GitHub Personal Access Token with repo permissions

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Usage

1. **Login**: Enter your GitHub Personal Access Token
   - Generate a token at https://github.com/settings/tokens
   - Required permissions: `repo` (Full control of private repositories)

2. **Access Repository**: Enter the GitHub username/organization and repository name

3. **Browse Files**: The app will look for a `specs.json` file in the repository root to determine the spec directory. If not found, it defaults to the `specs` folder.

4. **Edit Files**: Click on any file to open it in the editor
   - Use the toolbar for basic markdown formatting
   - Toggle between Edit and Preview modes
   - Save changes with descriptive commit messages

5. **Manage External Specifications**: Use the External Specs Manager to configure references to other repositories
   - Click "External Specs" button in the file explorer
   - Add new external specification references
   - Edit existing external spec configurations
   - Remove external specs that are no longer needed
   - Save changes directly to the specs.json file

### Configuration

The app looks for a `specs.json` file in the repository root with the following structure:

```json
{
  "specs": [
    {
      "spec_directory": "docs",
      "external_specs": [
        {
          "external_spec": "toip1",
          "gh_page": "https://henkvancann.github.io/ctwg-main-glossary/",
          "url": "https://github.com/henkvancann/ctwg-main-glossary",
          "terms_dir": "spec/terms-definitions"
        }
      ]
    }
  ]
}
```

#### External Specifications

External specifications allow you to reference terms from other repositories. Each external spec requires:

- **external_spec**: Unique identifier for the external specification
- **gh_page**: GitHub Pages URL where the spec is hosted
- **url**: GitHub repository URL
- **terms_dir**: Directory path containing the terms definitions

The External Specs Manager provides a user-friendly interface to manage these configurations without manually editing JSON.

If the specs.json file doesn't exist, the app will default to looking for files in a `specs` directory.

## Tech Stack

- **Vue 3**: Progressive JavaScript framework
- **Vue Router**: Client-side routing
- **Bootstrap 5**: CSS framework for responsive design
- **Vite**: Build tool and development server
- **Axios**: HTTP client for GitHub API calls

## Security

- GitHub tokens are stored in localStorage
- All API calls use GitHub's official REST API v3
- Tokens are sent via Authorization headers

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License
