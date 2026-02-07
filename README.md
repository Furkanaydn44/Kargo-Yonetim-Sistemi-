# Kargo Yönetim Sistemi (Cargo Management System)

Bu proje, kargo taşımacılığı, takibi ve optimizasyonu için geliştirilmiş kapsamlı bir web uygulamasıdır. Kullanıcıların kargo gönderimi yapabileceği, yöneticilerin ise araçları, istasyonları ve teslimat süreçlerini yönetebileceği bir platform sunar.

## 🚀 Özellikler

*   **Kullanıcı Paneli:**
    *   Kullanıcı Kaydı ve Girişi (JWT Authentication)
    *   Yeni Kargo Oluşturma
    *   Kargo Takibi
*   **Yönetici Paneli (Admin Dashboard):**
    *   Tüm Kargoları Görüntüleme ve Yönetme
    *   Araç Ekleme ve Yönetme
    *   İstasyon (Şube) Yönetimi
    *   Rota Optimizasyonu ve Planlama
*   **Harita Entegrasyonu:** Leaflet ile kargo ve araç konumlarının görselleştirilmesi.
*   **Optimizasyon:** Teslimat rotalarının ve araç doluluklarının optimize edilmesi.

## 🛠️ Teknolojiler

Bu proje **PERN** (PostgreSQL yerine MySQL kullanılarak) stack benzeri bir yapı ile geliştirilmiştir:

*   **Backend:**
    *   Node.js
    *   Express.js
    *   Sequelize (ORM)
    *   MySQL (Veritabanı)
    *   JWT (Kimlik Doğrulama)
    *   Geolib (Konum Hesaplamaları)
*   **Frontend:**
    *   React.js
    *   Vite (Build Tool)
    *   Tailwind CSS (Stil)
    *   React Router (Yönlendirme)
    *   Leaflet & React-Leaflet (Harita)
    *   Axios (API İstekleri)
    *   React Toastify (Bildirimler)

## ⚙️ Kurulum

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Ön Koşullar

*   [Node.js](https://nodejs.org/) (Sürüm 16 veya üzeri önerilir)
*   [MySQL](https://www.mysql.com/) Veritabanı

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/kullaniciadi/proje-adi.git
cd proje-adi
```

### 2. Backend Kurulumu

Backend klasörüne gidin ve bağımlılıkları yükleyin:

```bash
cd backend
npm install
```

`.env` dosyasını oluşturun veya düzenleyin. `backend` klasörü içinde bir `.env` dosyası oluşturun ve aşağıdaki ayarları kendi veritabanı ayarlarınıza göre güncelleyin:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sifreniz
DB_NAME=kargo
DB_DIALECT=mysql
JWT_SECRET=gizli_anahtar_kelime_buraya
```

Veritabanını başlatın (Eğer Sequelize otomatik oluşturuyorsa):
```bash
npm start
```
*Not: Veritabanı tabloları `server.js` çalıştırıldığında Sequelize tarafından otomatik olarak senkronize edilecektir.*

Alternatif olarak, veritabanını manuel olarak oluşturmak ve örnek verileri yüklemek için `backend` klasöründe bulunan `database.sql` dosyasını kullanabilirsiniz:

1.  MySQL Workbench veya komut satırını açın.
2.  `database.sql` dosyasının içeriğini kopyalayıp çalıştırın.


### 3. Frontend (İstemci) Kurulumu

Yeni bir terminal açın, ana dizine dönün ve `client` klasörüne gidin:

```bash
cd client
npm install
```

## ▶️ Çalıştırma

### Backend'i Başlatma

`backend` dizininde:

```bash
npm start
```
Server `http://localhost:5000` adresinde çalışacaktır.

### Frontend'i Başlatma

`client` dizininde:

```bash
npm run dev
```
Uygulama genellikle `http://localhost:5173` adresinde çalışacaktır (Vite çıktısını kontrol edin).

## 🤝 Katkıda Bulunma

1.  Bu projeyi forklayın.
2.  Yeni bir özellik dalı oluşturun (`git checkout -b feature/YeniOzellik`).
3.  Değişikliklerinizi commit yapın (`git commit -m 'Yeni özellik eklendi'`).
4.  Dalınızı pushlayın (`git push origin feature/YeniOzellik`).
5.  Bir Pull Request oluşturun.

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
