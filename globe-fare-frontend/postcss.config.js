module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    ...(process.env.NODE_ENV === 'production' && {
      autoprefixer: {},
      cssnano: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
          },
        ],
      },
    }),
  },
};
