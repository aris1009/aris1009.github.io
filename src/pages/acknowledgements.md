---
pagination:
  data: supportedLocales
  size: 1
  alias: locale
layout: page.njk
title: "{{ 'nav.acknowledgements' | i18n }}"
description: "{{ 'acknowledgements.description' | i18n }}"
permalink: "{{ locale }}/acknowledgements/"
---

{% if locale == 'en-us' %}
This blog was built using several excellent open-source projects and resources. I'd like to acknowledge and thank the creators and contributors.

## Core Framework & Technologies

| Technology | Description | Repository |
|------------|-------------|------------|
| **Eleventy (11ty)** | Static site generator that transforms templates into HTML | [⭐ Give them a star!](https://github.com/11ty/eleventy) |
| **Tailwind CSS** | Utility-first CSS framework for rapid UI development | [⭐ Give them a star!](https://github.com/tailwindlabs/tailwindcss) |
| **Shoelace** | Modern web component library with excellent accessibility by Cory LaViska | [⭐ Give them a star!](https://github.com/shoelace-style/shoelace) |
| **Nunjucks** | Powerful templating engine with inheritance and asynchronous control | [⭐ Give them a star!](https://github.com/mozilla/nunjucks) |
| **Prism.js** | Lightweight, extensible syntax highlighter for code blocks | [⭐ Give them a star!](https://github.com/PrismJS/prism) |

## Testing Frameworks

| Technology | Description | Repository |
|------------|-------------|------------|
| **Vitest** | Next generation unit testing framework powered by Vite | [⭐ Give them a star!](https://github.com/vitest-dev/vitest) |
| **Playwright** | Framework for web testing and automation across multiple browsers | [⭐ Give them a star!](https://github.com/microsoft/playwright) |

## Eleventy Plugins

This blog is enhanced by several Eleventy plugins that provide additional functionality:
- **[@11ty/eleventy-navigation](https://github.com/11ty/eleventy-navigation)** - Navigation plugin for structured site navigation
- **[@11ty/eleventy-plugin-rss](https://github.com/11ty/eleventy-plugin-rss)** - RSS feed generation for blog syndication
- **[eleventy-plugin-reading-time](https://github.com/johanbrook/eleventy-plugin-reading-time)** - Reading time calculation for articles
- **[eleventy-plugin-i18n](https://github.com/adamduncan/eleventy-plugin-i18n)** - Internationalization support for multiple languages

## Development Utilities

Additional tools and utilities that power the development and build process:
[Luxon](https://github.com/moment/luxon), [html-minifier](https://github.com/kangax/html-minifier), [npm-run-all](https://github.com/mysticatea/npm-run-all), [Husky](https://github.com/typicode/husky), [rimraf](https://github.com/isaacs/rimraf), [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography), [JSDOM](https://github.com/jsdom/jsdom)

## Theme

This blog builds upon the **Minimalism** theme by [Marco Micale](https://github.com/MarcoMicale).

- **Theme Repository**: [https://github.com/MarcoMicale/Minimalism](https://github.com/MarcoMicale/Minimalism)
- **Creator**: Marco Micale

## Thank You

Thank you to all the open-source developers and contributors who make projects like this possible. Your work enables others to build and share content on the web more easily.

---

*If you notice any attribution missing or incorrect, please let me know so I can update this page accordingly.*

{% elif locale == 'el' %}
Αυτό το ιστολόγιο δημιουργήθηκε χρησιμοποιώντας εξαιρετικά project και πόρους ανοιχτού κώδικα. Θα ήθελα να αναγνωρίσω και να ευχαριστήσω τους δημιουργούς και τους συνεισφέροντες.

## Βασικό Πλαίσιο & Τεχνολογίες

| Τεχνολογία | Περιγραφή | Αποθετήριο |
|------------|-----------|------------|
| **Eleventy (11ty)** | Γεννήτρια στατικού ιστότοπου που μετατρέπει πρότυπα σε HTML | [⭐ Δώσε ένα αστεράκι!](https://github.com/11ty/eleventy) |
| **Tailwind CSS** | Πλαίσιο CSS utility-first για ταχεία ανάπτυξη UI | [⭐ Δώσε ένα αστεράκι!](https://github.com/tailwindlabs/tailwindcss) |
| **Shoelace** | Σύγχρονη βιβλιοθήκη web components με εξαιρετική προσβασιμότητα από τον Cory LaViska | [⭐ Δώσε ένα αστεράκι!](https://github.com/shoelace-style/shoelace) |
| **Nunjucks** | Ισχυρή μηχανή προτύπων με κληρονομικότητα και ασύγχρονο έλεγχο | [⭐ Δώσε ένα αστεράκι!](https://github.com/mozilla/nunjucks) |
| **Prism.js** | Ελαφρύ, επεκτάσιμο εργαλείο επισήμανσης σύνταξης για κώδικα | [⭐ Δώσε ένα αστεράκι!](https://github.com/PrismJS/prism) |

## Πλαίσια Test

| Τεχνολογία | Περιγραφή | Αποθετήριο |
|------------|-----------|------------|
| **Vitest** | Πλαίσιο unit testing νέας γενιάς που τροφοδοτείται από το Vite | [⭐ Δώσε ένα αστεράκι!](https://github.com/vitest-dev/vitest) |
| **Playwright** | Πλαίσιο για web testing και αυτοματισμό σε πολλαπλούς browsers | [⭐ Δώσε ένα αστεράκι!](https://github.com/microsoft/playwright) |

## Eleventy Προσθήκες

Αυτό το ιστολόγιο ενισχύεται από διάφορα Eleventy plugins που παρέχουν επιπλέον λειτουργικότητα:
- **[@11ty/eleventy-navigation](https://github.com/11ty/eleventy-navigation)** - Plugin πλοήγησης για δομημένη πλοήγηση ιστότοπου
- **[@11ty/eleventy-plugin-rss](https://github.com/11ty/eleventy-plugin-rss)** - Παραγωγή RSS feed για blog syndication
- **[eleventy-plugin-reading-time](https://github.com/johanbrook/eleventy-plugin-reading-time)** - Υπολογισμός χρόνου ανάγνωσης για άρθρα
- **[eleventy-plugin-i18n](https://github.com/adamduncan/eleventy-plugin-i18n)** - Υποστήριξη διεθνοποίησης για πολλαπλές γλώσσες

## Εργαλεία Ανάπτυξης

Επιπλέον εργαλεία και utilities που τροφοδοτούν τη διαδικασία ανάπτυξης και κατασκευής:
[Luxon](https://github.com/moment/luxon), [html-minifier](https://github.com/kangax/html-minifier), [npm-run-all](https://github.com/mysticatea/npm-run-all), [Husky](https://github.com/typicode/husky), [rimraf](https://github.com/isaacs/rimraf), [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography), [JSDOM](https://github.com/jsdom/jsdom)

## Θέμα

Αυτό το ιστολόγιο χρησιμοποιεί το θέμα **Minimalism** από τον [Marco Micale](https://github.com/MarcoMicale).

- **Αποθετήριο Θέματος**: [https://github.com/MarcoMicale/Minimalism](https://github.com/MarcoMicale/Minimalism)
- **Δημιουργός**: Marco Micale

## Ευχαριστίες

Ευχαριστώ όλους τους προγραμματιστές ανοιχτού κώδικα και τους συνεισφέροντες που κάνουν δυνατά τα έργα σαν αυτό. Η δουλειά σας επιτρέπει σε άλλους να δημιουργούν και να μοιράζονται περιεχόμενο στον ιστό πιο εύκολα.

---

*Αν παρατηρήσετε κάποια αναφορά που λείπει ή είναι εσφαλμένη, παρακαλώ ενημερώστε με για να ενημερώσω αυτή τη σελίδα αναλόγως.*

{% elif locale == 'tr' %}
Bu blog, birkaç mükemmel açık kaynak proje ve kaynak kullanılarak oluşturulmuştur. Yaratıcıları ve katkıda bulunanları kabul etmek ve teşekkür etmek istiyorum.

## Temel Çerçeve & Teknolojiler

| Teknoloji | Açıklama | Depo |
|-----------|----------|------|
| **Eleventy (11ty)** | Şablonları HTML'ye dönüştüren statik site üreticisi | [⭐ Onlara bir yıldız verin!](https://github.com/11ty/eleventy) |
| **Tailwind CSS** | Hızlı UI geliştirme için utility-first CSS çerçevesi | [⭐ Onlara bir yıldız verin!](https://github.com/tailwindlabs/tailwindcss) |
| **Shoelace** | Cory LaViska tarafından mükemmel erişilebilirlik özelliklerine sahip modern web component kütüphanesi | [⭐ Onlara bir yıldız verin!](https://github.com/shoelace-style/shoelace) |
| **Nunjucks** | Kalıtım ve asenkron kontrol ile güçlü şablon motoru | [⭐ Onlara bir yıldız verin!](https://github.com/mozilla/nunjucks) |
| **Prism.js** | Kod blokları için hafif, genişletilebilir sözdizimi vurgulayıcı | [⭐ Onlara bir yıldız verin!](https://github.com/PrismJS/prism) |

## Test Çerçeveleri

| Teknoloji | Açıklama | Depo |
|-----------|----------|------|
| **Vitest** | Vite tarafından desteklenen yeni nesil birim test çerçevesi | [⭐ Onlara bir yıldız verin!](https://github.com/vitest-dev/vitest) |
| **Playwright** | Çoklu tarayıcıda web testi ve otomasyonu için çerçeve | [⭐ Onlara bir yıldız verin!](https://github.com/microsoft/playwright) |

## Eleventy Eklentileri

Bu blog, ek işlevsellik sağlayan çeşitli Eleventy eklentileri ile geliştirilmiştir:
- **[@11ty/eleventy-navigation](https://github.com/11ty/eleventy-navigation)** - Yapılandırılmış site navigasyonu için navigasyon eklentisi
- **[@11ty/eleventy-plugin-rss](https://github.com/11ty/eleventy-plugin-rss)** - Blog dağıtımı için RSS feed üretimi
- **[eleventy-plugin-reading-time](https://github.com/johanbrook/eleventy-plugin-reading-time)** - Makaleler için okuma süresi hesaplama
- **[eleventy-plugin-i18n](https://github.com/adamduncan/eleventy-plugin-i18n)** - Çoklu dil için uluslararasılaştırma desteği

## Geliştirme Araçları

Geliştirme ve yapı sürecini destekleyen ek araçlar ve yardımcı programlar:
[Luxon](https://github.com/moment/luxon), [html-minifier](https://github.com/kangax/html-minifier), [npm-run-all](https://github.com/mysticatea/npm-run-all), [Husky](https://github.com/typicode/husky), [rimraf](https://github.com/isaacs/rimraf), [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography), [JSDOM](https://github.com/jsdom/jsdom)

## Tema

Bu blog, [Marco Micale](https://github.com/MarcoMicale) tarafından yapılan **Minimalism** temasını kullanır.

- **Tema Deposu**: [https://github.com/MarcoMicale/Minimalism](https://github.com/MarcoMicale/Minimalism)
- **Yaratıcı**: Marco Micale

## Teşekkürler

Bunun gibi projeleri mümkün kılan tüm açık kaynak geliştiricilerine ve katkıda bulunanlara teşekkür ederim. Çalışmanız, diğerlerinin web'de içerik oluşturmasını ve paylaşmasını daha kolay hale getirir.

---

*Eksik veya yanlış bir atıf fark ederseniz, lütfen bu sayfayı buna göre güncelleyebilmem için bana bildirin.*
{% endif %}
