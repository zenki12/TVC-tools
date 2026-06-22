try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const { createApp } = await import('./app.js');
const port = Number(process.env.PORT || 3001);

createApp().listen(port, () => {
  console.log(`TVC Tool server listening on http://localhost:${port}`);
});
