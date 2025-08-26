# TaskMan BACKEND

TaskMan, **Golang, Gin, PostgreSQL ve Redis** kullanan bir task yönetim uygulamasidir.
Projede temel amaç: **CRUD işlemleri + cache mekanizması + örnek veriler**.

---

## Özellikler

* PostgreSQL ile veri saklama (User, Board, Task tabloları)
* Redis ile cache mekanizması (GET /boards örneği)
* Gin framework ile RESTful API
* Örnek veriler ile hızlı test (seed data)

---

## Gereksinimler

* Go 1.21+
* PostgreSQL
* Redis
* Make / Docker (isteğe bağlı)

---

## Kurulum

1. Repo klonla:

```bash
git clone <repo-url>
cd TaskMan
```

2. PostgreSQL ve Redis çalıştır:

**PostgreSQL**

```bash
psql -U postgres
CREATE DATABASE taskman;
CREATE USER taskman WITH PASSWORD '123456';
GRANT ALL PRIVILEGES ON DATABASE taskman TO taskman;
```

**Redis**

```bash
sudo systemctl start redis
sudo systemctl enable redis
```

3. Go modüllerini yükle:

```bash
go mod tidy
```

---

## Çalıştırma

```bash
go run ./cmd/server
```

* Server 8080 portunda çalışır.
* Örnek veri otomatik eklenir.

---

### Örnek GET /boards response

```json
{
  "data": [
    {
      "ID": 1,
      "Title": "Görev Listesi",
      "UserID": 1,
      "CreatedAt": "2025-08-26T23:39:53Z",
      "UpdatedAt": "2025-08-26T23:39:53Z",
      "Tasks": [
        {
          "ID": 1,
          "Title": "Proje Planı Hazırla",
          "Description": "TaskMan API için proje planı hazırlayacak",
          "Status": "todo",
          "BoardID": 1
        }
      ]
    }
  ],
  "source": "cache"
}
```

* `"source": "db"` → veri DB’den geldi
* `"source": "cache"` → veri Redis’ten geldi

---

💡 Bu README, proje geliştirmeye hızlı başlamak için hazırlandı.
