const acclaimed = require('acclaimed');

async function buildCriticalCSS() {
  try {
    const result = await acclaimed.critical([
      'http://localhost:8080/',
      'http://localhost:8080/css/style.css',
      '--width=1920',
      '--height=1800',
      '--forceInclude=html',
      '--forceInclude=body',
      '--forceInclude=header',
      '--forceInclude=main',
      '--forceInclude=article',
      '--forceInclude=footer',
      '--forceInclude=container',
      '--forceInclude=mx-auto',
      '--forceInclude=px-5',
      '--forceInclude=py-4',
      '--forceInclude=bg-zinc-100',
      '--forceInclude=dark:bg-zinc-900',
      '--forceInclude=text-slate-900',
      '--forceInclude=dark:text-slate-100',
      '--forceInclude=font-serif',
      '--forceInclude=prose',
      '--forceInclude=prose-sky',
      '--forceInclude=dark:prose-invert',
      '--forceInclude=burger-menu',
      '--forceInclude=theme-toggle',
      '--forceInclude=language-selector',
      '--forceExclude=@font-face'
    ]);

    // Clean up CSS for inline usage
    return result.css.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Critical CSS build failed:', error);
    return '';
  }
}

module.exports = { buildCriticalCSS };

// For testing
if (require.main === module) {
  buildCriticalCSS().then(css => {
    console.log('Critical CSS generated:', css.length, 'characters');
    if (css) {
      console.log('Sample:', css.substring(0, 200) + '...');
    }
  });
}