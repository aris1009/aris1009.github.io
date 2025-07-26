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

## {{ 'acknowledgements.staticSiteGenerator' | i18n }}

This blog is powered by **Eleventy** (11ty), a simpler static site generator that transforms templates into HTML.

- **Project**: [https://www.11ty.dev/](https://www.11ty.dev/)
- **Creator**: Zach Leatherman and the Eleventy community
- **GitHub Repository**: [Give them a ⭐!](https://github.com/11ty/eleventy)

## {{ 'acknowledgements.theme' | i18n }}

This blog uses the **Minimalism** theme by [Marco Micale](https://github.com/MarcoMicale).

- **Theme Repository**: [https://github.com/MarcoMicale/Minimalism](https://github.com/MarcoMicale/Minimalism)
- **Creator**: Marco Micale

## {{ 'acknowledgements.additionalTechnologies' | i18n }}

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Nunjucks**: Templating engine for dynamic content generation
- **Node.js**: JavaScript runtime for the build process

## {{ 'acknowledgements.thankYou' | i18n }}

Thank you to all the open-source developers and contributors who make projects like this possible. Your work enables others to build and share content on the web more easily.

---

*If you notice any attribution missing or incorrect, please let me know so I can update this page accordingly.*
{% elif locale == 'el' %}
Αυτό το ιστολόγιο δημιουργήθηκε χρησιμοποιώντας εξαιρετικά project και πόρους ανοιχτού κώδικα. Θα ήθελα να αναγνωρίσω και να ευχαριστήσω τους δημιουργούς και τους συνεισφέροντες.

## {{ 'acknowledgements.staticSiteGenerator' | i18n }}

Αυτό το ιστολόγιο τροφοδοτείται από το **Eleventy** (11ty), έναν απλούστερο γεννήτρια στατικού ιστότοπου που μετατρέπει πρότυπα σε HTML.

- **Project**: [https://www.11ty.dev/](https://www.11ty.dev/)
- **Δημιουργός**: Zach Leatherman και η κοινότητα Eleventy
- **Αποθετήριο GitHub**: [Δώσε ένα ⭐-ράκι!](https://github.com/11ty/eleventy)

## {{ 'acknowledgements.theme' | i18n }}

Αυτό το ιστολόγιο χρησιμοποιεί το θέμα **Minimalism** από τον [Marco Micale](https://github.com/MarcoMicale).

- **Αποθετήριο Θέματος**: [https://github.com/MarcoMicale/Minimalism](https://github.com/MarcoMicale/Minimalism)
- **Δημιουργός**: Marco Micale

## {{ 'acknowledgements.additionalTechnologies' | i18n }}

- **Tailwind CSS**: Πλαίσιο CSS utility-first για ταχεία ανάπτυξη UI
- **Nunjucks**: Μηχανή προτύπων για δυναμική παραγωγή περιεχομένου
- **Node.js**: JavaScript runtime για τη διαδικασία κατασκευής

## {{ 'acknowledgements.thankYou' | i18n }}

Ευχαριστώ όλους τους προγραμματιστές ανοιχτού κώδικα και τους συνεισφέροντες που κάνουν δυνατά τα έργα σαν αυτό. Η δουλειά σας επιτρέπει σε άλλους να δημιουργούν και να μοιράζονται περιεχόμενο στον ιστό πιο εύκολα.

---

*Αν παρατηρήσετε κάποια αναφορά που λείπει ή είναι εσφαλμένη, παρακαλώ ενημερώστε με για να ενημερώσω αυτή τη σελίδα αναλόγως.*
{% elif locale == 'tr' %}
Bu blog, birkaç mükemmel açık kaynak proje ve kaynak kullanılarak oluşturulmuştur. Yaratıcıları ve katkıda bulunanları kabul etmek ve teşekkür etmek istiyorum.

## {{ 'acknowledgements.staticSiteGenerator' | i18n }}

Bu blog, şablonları HTML'ye dönüştüren daha basit bir statik site üreticisi olan **Eleventy** (11ty) tarafından desteklenmektedir.

- **Proje**: [https://www.11ty.dev/](https://www.11ty.dev/)
- **Yaratıcı**: Zach Leatherman ve Eleventy topluluğu
- **GitHub Deposu**: [Onlara bir ⭐ verin!](https://github.com/11ty/eleventy)

## {{ 'acknowledgements.theme' | i18n }}

Bu blog, [Marco Micale](https://github.com/MarcoMicale) tarafından yapılan **Minimalism** temasını kullanır.

- **Tema Deposu**: [https://github.com/MarcoMicale/Minimalism](https://github.com/MarcoMicale/Minimalism)
- **Yaratıcı**: Marco Micale

## {{ 'acknowledgements.additionalTechnologies' | i18n }}

- **Tailwind CSS**: Hızlı UI geliştirme için utility-first CSS çerçevesi
- **Nunjucks**: Dinamik içerik üretimi için şablon motoru
- **Node.js**: Yapı süreci için JavaScript çalışma zamanı

## {{ 'acknowledgements.thankYou' | i18n }}

Bunun gibi projeleri mümkün kılan tüm açık kaynak geliştiricilerine ve katkıda bulunanlara teşekkür ederim. Çalışmanız, diğerlerinin web'de içerik oluşturmasını ve paylaşmasını daha kolay hale getirir.

---

*Eksik veya yanlış bir atıf fark ederseniz, lütfen bu sayfayı buna göre güncelleyebilmem için bana bildirin.*
{% endif %}