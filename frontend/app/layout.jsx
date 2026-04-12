import '../styles/globals.css' 

export const metadata = {
  title: 'CollabCode — Real-Time Collaborative Editor',
  description: 'Write and run code together in real time',
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning prevents a React warning caused by
    // the theme class being added before React hydrates
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Theme initialisation script — runs before React loads
            so there's no flash of wrong theme on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}