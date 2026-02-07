# Projeyi GitHub'a Yükleme Rehberi

Bu rehber, projenizi GitHub'a yüklemek için gerekli adımları içerir.

## Ön Hazırlık

1.  **Git Yüklü Olduğundan Emin Olun:**
    Terminalde `git --version` komutunu çalıştırarak Git'in yüklü olup olmadığını kontrol edin.

2.  **GitHub Hesabınız Olsun:**
    [GitHub](https://github.com/) üzerinde bir hesabınız olduğundan emin olun.

## Adım Adım Yükleme

### 1. GitHub'da Yeni Bir Depo (Repository) Oluşturun

1.  GitHub hesabınıza giriş yapın.
2.  Sağ üst köşedeki `+` butonuna tıklayın ve "New repository" seçeneğini seçin.
3.  **Repository name** kısmına projenizin adını (örneğin `kargo-yonetim-sistemi`) yazın.
4.  **Public** veya **Private** seçeneğini belirleyin.
5.  "Initialize this repository with a README" seçeneğini **İŞARETLEMEYİN** (zaten projemizde var).
6.  "Create repository" butonuna tıklayın.

### 2. Projenizi Git İle Başlatın

Projenizin bulunduğu klasörde terminali açın ve aşağıdaki komutları sırasıyla çalıştırın:

```bash
# Git deposunu başlatın
git init

# Tüm dosyaları takibe alın (.gitignore sayesinde gereksiz dosyalar hariç tutulur)
git add .

# İlk commit işlemini yapın
git commit -m "Proje başlangıç dosyaları eklendi"
```

### 3. Depoyu GitHub'a Bağlayın ve Yükleyin

GitHub'da oluşturduğunuz deponun sayfasında size verilen linki kopyalayın (örneğin: `https://github.com/kullaniciadi/repo-adi.git`).

Aşağıdaki komutta `REPO_URL` kısmına kopyaladığınız linki yapıştırın:

```bash
# Ana dalın (branch) adını 'main' olarak ayarlayın
git branch -M main

# Uzak depoyu ekleyin (LINK_BURAYA kısmını kendi repo linkinizle değiştirin)
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git

# Kodlarınızı GitHub'a gönderin
git push -u origin main
```

## Güncellemeler Nasıl Yapılır?

Kodunuzda değişiklik yaptıktan sonra GitHub'a güncellemek için:

```bash
git add .
git commit -m "Yaptığınız değişikliğin kısa açıklaması"
git push
```
