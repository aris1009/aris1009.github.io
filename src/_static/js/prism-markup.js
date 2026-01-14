/* PrismJS Markup Language Bundle - HTML, XML, SVG, MathML, SSML, Atom, RSS */
(function (Prism) {
  Prism.languages.markup = {
    comment: {
      pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
      greedy: true
    },
    prolog: {
      pattern: /<\?[\s\S]+?\?>/,
      greedy: true
    },
    doctype: {
      // https://www.w3.org/TR/xml/#NT-doctypedecl
      pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\])*\s*>/i,
      greedy: true,
      inside: {
        "internal-subset": {
          pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
          lookbehind: true,
          greedy: true,
          inside: null // see below
        },
        "string": {
          pattern: /"[^"]*"|'[^']*'/,
          greedy: true
        },
        "punctuation": /^<!|>$|[[\]]/,
        "doctype-tag": /^DOCTYPE/i,
        "name": /[^\s<>'"]+/
      }
    },
    cdata: {
      pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
      greedy: true
    },
    tag: {
      pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>])|"(?:[^"]|\\")*"|'(?:[^']|\\')*'))?)*\s*\/?>/,
      greedy: true,
      inside: {
        "tag": {
          pattern: /^<\/?[^\s>\/]+/,
          inside: {
            "punctuation": /^<\/?/,
            "namespace": /^[^\s>\/:]+:/
          }
        },
        "special-attr": [],
        "attr-value": {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            "punctuation": [
              {
                pattern: /^=/,
                alias: "attr-equals"
              },
              {
                pattern: /^(\s*)["']|["']$/,
                lookbehind: true
              }
            ]
          }
        },
        "punctuation": /\/?>/,
        "attr-name": {
          pattern: /[^\s>\/]+/,
          inside: {
            "namespace": /^[^\s>\/:]+:/
          }
        }
      }
    },
    entity: [
      {
        pattern: /&[\da-z]{1,31};/i,
        alias: "named-entity"
      },
      {
        pattern: /&#x?[\da-f\d]+;/i
      }
    ]
  };

  Prism.languages.markup["tag"].inside["attr-value"].inside["entity"] = Prism.languages.markup["entity"];
  Prism.languages.markup["doctype"].inside["internal-subset"].inside = Prism.languages.markup;

  // Plugin to make entity title show the real entity, idea by Roman Komarov
  Prism.hooks.add('wrap', function (env) {
    if (env.type === 'entity') {
      env.attributes['title'] = env.content.replace(/&amp;/, '&');
    }
  });

  Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    value: function addInlined(tagName, lang) {
      var includedCdataInside = {};
      includedCdataInside['language-' + lang] = {
        pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
        lookbehind: true,
        inside: Prism.languages[lang]
      };
      includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

      var inside = {
        'included-cdata': {
          pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
          inside: includedCdataInside
        }
      };
      inside['language-' + lang] = {
        pattern: /[\s\S]+/,
        inside: Prism.languages[lang]
      };

      var def = {};
      def[tagName] = {
        pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
        lookbehind: true,
        greedy: true,
        inside: inside
      };

      Prism.languages.insertBefore('markup', 'cdata', def);
    }
  });

  Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    value: function (attrName, lang) {
      Prism.languages.markup.tag.inside['special-attr'].push({
        pattern: RegExp(
          /(^|["'\s])/.source +
          '(?:' + attrName + ')' +
          /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
          'i'
        ),
        lookbehind: true,
        inside: {
          'attr-name': /^[^\s=]+/,
          'attr-value': {
            pattern: /=[\s\S]+/,
            inside: {
              'value': {
                pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                lookbehind: true,
                alias: [lang, 'language-' + lang],
                inside: Prism.languages[lang]
              },
              'punctuation': [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                /"|'/
              ]
            }
          }
        }
      });
    }
  });

  Prism.languages.html = Prism.languages.markup;
  Prism.languages.mathml = Prism.languages.markup;
  Prism.languages.svg = Prism.languages.markup;
  Prism.languages.xml = Prism.languages.markup;
  Prism.languages.ssml = Prism.languages.markup;
  Prism.languages.atom = Prism.languages.markup;
  Prism.languages.rss = Prism.languages.markup;

}(Prism));