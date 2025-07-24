---
layout: article.njk
title: "\"Saklayacak Bir Şeyim Yok\" Düşüncesi Sizi Rus Hackerlardan Korumayacak"
description: "Rus askeri istihbaratının korsan yazılım aracılığıyla sıradan insanları hedef alan son olayları, bu düşüncenin tehlikeli bir şekilde yanlış olduğunu kanıtlıyor."
date: 2025-07-22
keyword: güvenlik, kötü amaçlı yazılım, gizlilik, rus hackerlar, siber güvenlik
type: article
locale: tr
permalink: /blog/tr/gru-kms-windows/
---

Bunu daha önce duydum: "Saklayacak bir şeyim yok, neden güvenlik konusunda endişeleneyim ki?"
Rus askeri istihbaratının korsan yazılım üzerinden sıradan insanları hedef alması konusundaki son olaylar, bu düşüncenin ne kadar tehlikeli ve yanlış olduğunu kanıtlıyor.

2023'ün sonlarında, Rusya'nın GRU'su milyonlarca insanın her gün yaptığı bir şeyi silaha çeviren sofistike bir kampanya başlattı - ücretsiz yazılım indirmek. Özellikle korsan Windows etkinleştirme araçları kullanan insanları hedef alarak, gündelik bilgisayarları casusluk ağlarına dönüştürdüler ve tüm aileleri riske attılar.

İşte bu durum neden seni de ilgilendiriyor, "önemsiz biriyim" diye düşünsen bile.

## Ücretsiz Yazılımın Her Şeye Mal Olduğu An

Bu operasyon sahte Microsoft KMS etkinleştiriciler üzerinden çalışıyor - insanların lisans ücreti ödemeden Windows'u etkinleştirmek için kullandığı araçlar. Rus hackerlar gerçekleriyle birebir aynı görünen ve çalışan ama gizlice bilgisayarına üç tehlikeli program kuran kötü amaçlı versiyonlar yaratmış:

- **BACKORDER**: Windows Defender'ı devre dışı bırakan ve sistemini açan program.
- **Dark Crystal RAT**: Şifreleri çalan, ekran görüntüleri alan ve yazdığın her şeyi kaydeden program.
- **Kalambur**: Tor ağları kullanarak kalıcı arka kapılar oluşturan program.

Siber güvenlik {% externalLink "araştırmacılarına göre", "https://blog.eclecticiq.com/sandworm-apt-targets-ukrainian-users-with-trojanized-microsoft-kms-activation-tools-in-cyber-espionage-campaigns" %}, bu sahte araçlar torrent siteleri ve yasadışı yazılım forumları üzerinden dağıtılmış, öncelikle Ukraynalı kullanıcıları hedef alıyor ama küresel genişleme potansiyeli de var.

Korkutucu olan kısım? Etkinleştirme araçları gerçekten çalışıyor. Windows'un etkinleşiyor, her şey normal görünüyor ama bilgisayarın artık Rus istihbaratının malı.

## "Önemsiz Birinden" Aslında Ne Çalıyorlar

Bilgisayarın ele geçirildiğinde ne olduğu konusunda net olalım. Bu sadece devlet sırları meselesi değil, tüm dijital hayatın meselesi:

**Mali Bilgiler**
- Kaydedilmiş şifrelerden banka giriş bilgileri
- Tarayıcılarda saklanan kredi kartı numaraları
- Online alışveriş hesap detayları
- Vergi belgeleri ve mali kayıtlar

**Kişisel İletişimler**
- Aile fotoğrafları ve videoları
- Arkadaşlar ve partnerlerle özel mesajlar
- İş e-postaları ve belgeleri
- Sosyal medya hesapları

**Kimlik Bilgileri**
- Saklanan belgelerden TC kimlik numaraları
- Ehliyet fotoğrafları
- Tıbbi kayıtlar ve sigorta bilgileri
- Çocukların kişisel bilgileri

Dark Crystal RAT özellikle Chrome, Firefox ve Edge'deki tarayıcı kimlik bilgilerini hedef alıyor, ayrıca FTP istemcileri, Steam hesapları, Telegram ve Discord için uygulama şifrelerini de. Şimdiye kadar kaydettiğin her şey kopyalanıp yabancı istihbarat servislerinin kontrol ettiği sunuculara gönderiliyor.

## Bilgisayarın Başkalarına Karşı Silah Oluyor

İşte "saklayacak bir şeyim yok" argümanının tamamen çöktüğü nokta burası. Ele geçirildikten sonra bilgisayarın sadece senin bilgilerini sızdırmıyor, başkalarına saldırmak için de araç oluyor.

**Botnet Katılımı**  
Makinenin şunlar için kullanılan enfekte bilgisayar ağlarına katılıyor:
- Kritik altyapıya karşı dağıtık hizmet reddi saldırıları
- Bilgisayarını yavaşlatan ve elektrik faturalarını artıran kripto para madenciliği
- İletişim listendeki kişiler için istenmeyen sonuçlar doğurabilecek spam e-posta dağıtımı

**Ağ Sızması**  
İş yerindeki ağlara, aile Wi-Fi'ına veya halka açık internete bağlanırsan, kötü amaçlı yazılım şunlara yayılabilir:
- İşvereninin sistemleri, potansiyel olarak işlere mal olup işletmelere zarar verebilir
- Aynı ağa bağlı aile üyelerinin cihazları
- Dosya paylaştığında veya evlerini ziyaret ettiğinde arkadaşlarının bilgisayarları

**Sosyal Mühendislik Saldırıları**  
Hackerlar çaldıkları kişisel bilgilerini şunlar için kullanıyor:
- Arkadaşlara ve aileye karşı saldırılarda seni taklit etmek
- Gerçek ilişkilerini kullanarak ikna edici {% dictionaryLink "phishing", "phishing" %} e-postaları veya mesajları (Telegram, Discord, WhatsApp vs.) oluşturmak
- Sana güvenen insanlara ait hesaplara erişim sağlamak

{% externalLink "CERT-UA", "https://socprime.com/blog/detect-sandworm-apt-attacks-against-ukraine/" %}, belgelerine göre, doğrulanmış vakalar arasında kişisel cihazlarda korsan yazılım kullanan çalışanlar vasıtasıyla Ukraynalı kamu hizmeti şirketlerinin ele geçirilmesi de var - bu cihazlar daha sonra iş ağlarına bağlanmış.

## Bu Zaten Yaşanıyor

Bu teorik değil. {% externalLink "Resmi kaynaklar", "https://itc.ua/en/news/russian-hackers-attack-ukrainians-with-windows-kms-activator-and-fake-updates/" %} sivil bilgisayarları hedef alan aktif kampanyaları doğruluyor, belgelenmiş vakalar arasında şunlar var:

- Sahte etkinleştirme araçları yoluyla ele geçirilen kişisel cihazlar
- Bir bilgisayar enfekte olduktan sonra sızan aile ağları
- Çalışanlar enfekte laptopları işyerine getirdiğinde ihlal edilen iş sistemleri
- Ele geçirilen sivil bağlantılar üzerinden hedef alınan kritik altyapı

Kampanya 2023'ün sonlarından beri aktif ve gelişmeye devam ediyor. Ocak 2025'te yeni varyantlar tespit edildi, bunun süregelen, ısrarlı bir tehdit olduğunu gösteriyor.

## Düşündüğünden Çok Daha Değerlisin

Yabancı istihbarat teşkilatları sıradan insanları şu nedenlerle hedef alıyor:

**Erişim Erişimdir**  
Bilgisayarın daha değerli ağlara bağlanıyor olabilir. Evde ara sıra kullandığın iş laptopu? Eşinin devlet işindeki bilgisayarı? Üniversiteli çocuğunun üniversite ağ erişimi? Hepsi daha yüksek değerdeki hedeflere giden potansiyel yollar.

**Bilgi Profil Oluşturuyor**  
Online yaptığın her şey istihbarat değeri yaratıyor:
- Fotoğraflardan, gömülü metadata'dan ve konum verilerinden seyahat kalıpları
- Ağ ilişkilerini açığa çıkaran sosyal bağlantılar
- Istila hedeflerini belirleyen siyasi görüşler (bu konu hakkında gelecek blog yazısı planlanıyor)
- Etki veya zafiyet öneren mali durum, seni "hedef" yapıyor

**Ölçek Önemli**  
İstihbarat teşkilatlarının herkesi tek tek hedef alması gerekmiyor. Bu gibi kampanyalarla geniş ağlar atıyorlar, sonra da avı analiz ediyorlar. Senin verilen binlercesiyle birleştirilerek toplumların, ekonomilerin ve potansiyel zayıflıkların detaylı resimleri oluşturuluyor.

**Gelecekteki Hedefleme**  
Bugün çalınan bilgiler yıllarca, belki de sonsuza dek saklanıyor. Bir üniversite öğrencisinin ele geçirilen bilgisayarı ya da ele geçirilen akıllı telefonu şu anda önemsiz görünebilir, ama mezun olup askerlik hizmetine başladıklarında ne olur? İstihbarat uzun vadeli oyunla ilgilidir.

## Kendini ve Başkalarını Korumak

Çözüm karmaşık değil, ama bazı alışkanlıkları değiştirmek gerekiyor:

**Yasal Yazılım Kullanımı**
- Windows kullanmak zorundaysan yasal bir lisans satın al, ya da daha iyisi Linux'a geç - ücretsiz ve daha güvenli
- Torrent sitelerinden ve "crackli" yazılımlardan kaçın
- Resmi app store'ları, bilinen geliştirici web sitelerini ve onaylanmış Açık Kaynak uygulamaları kullan

**Temel Güvenlik Hijyeni**
- İşletim sistemi ve tüm yazılımları otomatik olarak güncel tut
- Ücretsiz antivirüs veya ücretsiz {% dictionaryLink "VPN", "vpn" %}'ler kullanma
- Windows kullanıyorsan Windows Defender'ın etkin, çalışır durumda ve sık güncellenen olduğundan emin ol
- Beklenmeyen pop-up'lar veya yavaş performans gibi olağandışı aktivite için cihazlarını izle

**Ağ Ayrımı**
- Kişisel cihazları iş ağlarına bağlamaktan kaçın. Ele geçirmenin her iki yönde de olabileceğini unutma ve şirketin muhtemelen senden daha önemli bir hedef olduğunu hatırla
- Özellikle sadece bir kez görebileceğin kişiler (arkadaşların arkadaşları vs.) için misafir WiFi kur ve kullan
- Router'ının admin şifresini değiştir, asla varsayılanı kullanma, düzenli olarak değiştir

**Farkındalık ve Eğitim**
- Aile üyelerini bu riskler hakkında eğit
- Önemli verilerin çevrimdışı yedeklerini tut

Microsoft'un {% externalLink "güvenlik rehberliğine göre", "https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?Name=HackTool:Win32/KMSActivator.A!MSR&threatId=-2147224043" %}, yasal yazılım ve güvenlik güncellemelerini kullandığında Windows Defender bu tehditleri otomatik olarak tespit edip kaldırıyor.

Sonuç şu: "Saklayacak bir şeyim yok" argümanı artık geçerli değil. Hackerlar önemli olup olmadığını umursamıyor - sadece çevrimiçi ve korunmasız olman yeterli.

**Sources:**
- {% externalLink "EclecticIQ: Sandworm APT Targets Ukrainian Users", "https://blog.eclecticiq.com/sandworm-apt-targets-ukrainian-users-with-trojanized-microsoft-kms-activation-tools-in-cyber-espionage-campaigns" %}
- {% externalLink "SOC Prime: Detect Sandworm APT Attacks Against Ukraine", "https://socprime.com/blog/detect-sandworm-apt-attacks-against-ukraine/" %}
- {% externalLink "Microsoft Security Intelligence: KMSActivator Threat Description", "https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?Name=HackTool:Win32/KMSActivator.A!MSR&threatId=-2147224043" %}
- {% externalLink "ITC.ua: Russian Hackers Attack Ukrainians with Windows KMS Activator", "https://itc.ua/en/news/russian-hackers-attack-ukrainians-with-windows-kms-activator-and-fake-updates/" %}