/* PrismJS Markdown Language Bundle */
(function (Prism) {
  Prism.languages.markdown = Prism.languages.extend('markup', {});
  Prism.languages.insertBefore('markdown', 'prolog', {
    'front-matter': {
      pattern: /^---[\s\S]*?^---$/,
      greedy: true,
      inside: {
        'punctuation': /^---|---$/,
        'front-matter': {
          pattern: /\S+(?=:)/,
          alias: 'property'
        },
        'string': /:.*/
      }
    },
    'blockquote': {
      // > ...
      pattern: /^>(?:[\t ]*>)*/,
      alias: 'punctuation'
    },
    'list': {
      // - ..., * ..., + ..., numbered, roman, letters
      pattern: /(?:^\s*(?:[-*+]|(?<![-+*])\d+(?:\.\s|\)\s|\)\s(?![-+*]))|(?:^\s*(?:[a-z]|\d+)\.\s))/m,
      alias: 'punctuation',
      greedy: true
    },
    'bold': {
      // **...** __...__
      pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
      lookbehind: true,
      greedy: true,
      inside: {
        'content': {
          pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?(?=\2)/,
          lookbehind: true
        },
        'punctuation': /\*\*|__/
      }
    },
    'italic': {
      // *...* _..._
      pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
      lookbehind: true,
      greedy: true,
      inside: {
        'content': {
          pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?(?=\2)/,
          lookbehind: true
        },
        'punctuation': /\*|_/
      }
    },
    'strike': {
      // ~~...~~
      pattern: /(^|[^\\])(~~?)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
      lookbehind: true,
      greedy: true,
      inside: {
        'content': {
          pattern: /(^|[^\\])(~~?)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?(?=\2)/,
          lookbehind: true
        },
        'punctuation': /~~?/
      }
    },
    'code': [
      {
        // `...` inline code
        pattern: /(`)(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
        greedy: true,
        inside: {
          'punctuation': /^`|`$/
        }
      },
      {
        // ```...``` code block
        pattern: /(```)(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
        greedy: true,
        inside: {
          'punctuation': /^```|```$/
        }
      },
      {
        // ~~~...~~~ code block
        pattern: /(~~~)(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
        greedy: true,
        inside: {
          'punctuation': /^~~~|~~~$/
        }
      }
    ],
    'hr': {
      // ---
      pattern: /^[-*_]{3,}$/m,
      alias: 'punctuation'
    },
    'url': {
      // [text](url)
      pattern: /!?\[(?!\])[\s\S]*?\]\([^)]+\)/,
      inside: {
        'punctuation': /^\!?\[|\]$|\(|\)$/,
        'url': {
          pattern: /[^\s()]+/,
          inside: {
            'punctuation': /^[()]/
          }
        }
      },
      alias: 'url'
    },
    'link': {
      // ![alt](url) or [text](url)
      pattern: /!?\[(?!\])[\s\S]*?\]\([^)]+\)/,
      inside: {
        'punctuation': /^\!?\[|\]$|\(|\)$/,
        'url': {
          pattern: /[^\s()]+/,
          inside: {
            'punctuation': /^[()]/
          }
        }
      },
      alias: 'url'
    },
    'table': {
      pattern: /\|.*\|\s*$/m,
      inside: {
        'punctuation': /\|/
      }
    },
    'table-header': {
      pattern: /^.*\|\s*$/m,
      inside: {
        'punctuation': /\|/
      }
    }
  });

  Prism.languages.md = Prism.languages.markdown;

}(Prism));