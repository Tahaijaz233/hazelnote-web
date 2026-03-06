import './globals.css';
// CHANGED: Using relative path instead of the @/ shortcut
import { AppProvider } from '../context/AppContext';

export const metadata = {
  title: 'HazelNote',
  description: 'AI-Powered Study Workspace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
