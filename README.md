# Generator Bagan Organisasi Fleksibel

Ini adalah aplikasi web interaktif untuk membuat, memvisualisasikan, dan mengelola bagan organisasi secara dinamis. Dibuat dengan D3.js dan Tailwind CSS, aplikasi ini memungkinkan pengguna untuk membangun struktur organisasi yang kompleks dengan mudah melalui antarmuka seret dan lepas (drag-and-drop).

Aplikasi ini sepenuhnya berjalan di sisi klien (client-side), artinya tidak ada data Anda yang dikirim atau disimpan di server. Semua data tetap aman di browser Anda.

![Pratinjau Aplikasi](https://i.ibb.co/9g7X7Y1/Screenshot-2024-07-25-at-12-00-00-Generator-Bagan-Organisasi-Fleksibel.png)

## ✨ Fitur Utama

- **Antarmuka Intuitif**: Buat dan modifikasi bagan dengan mudah.
- **Seret & Lepas (Drag & Drop)**: Ubah posisi dan hierarki jabatan hanya dengan menggesernya.
- **Struktur Fleksibel**: Tambahkan tidak hanya **Bawahan** (hubungan vertikal) tetapi juga **Anggota Tim** (hubungan horizontal/sejajar).
- **Edit Langsung**: Klik dua kali pada jabatan mana pun untuk mengedit peran dan nama secara langsung di bagan.
- **Responsif & Mobile-Friendly**: Dapat digunakan dengan nyaman di perangkat desktop maupun seluler.
- **Tema Visual**: Pilih dari beberapa tema (Default, Dark, Formal) untuk menyesuaikan tampilan bagan.
- **Undo/Redo**: Jangan khawatir membuat kesalahan. Batalkan dan ulangi aksi Anda dengan mudah.
- **Ekspor & Impor**:
  - **Ekspor ke PNG**: Simpan bagan Anda sebagai gambar berkualitas tinggi dengan berbagai pilihan ukuran kertas (A4, A3, Letter).
  - **Ekspor/Impor JSON**: Simpan progres Anda dalam format JSON dan lanjutkan kapan saja. Bagikan data struktur Anda dengan orang lain.
- **Privasi Terjamin**: Semua proses dilakukan di browser Anda. Tidak ada data yang diunggah ke server.

## 🚀 Cara Menggunakan

### 1. Memulai
- Buka file `index.html` di browser web modern seperti Chrome, Firefox, atau Edge.
- Anda akan disambut dengan bagan awal yang berisi satu jabatan puncak.

### 2. Mengubah Judul
- Klik pada kolom "Judul Organisasi" di panel kontrol sebelah kiri untuk memberi nama bagan Anda. Judul ini akan muncul di atas bagan dan digunakan sebagai nama file saat mengekspor.

### 3. Menambah Entitas (Jabatan/Anggota)
1.  Isi **Jabatan/Peran** dan **Nama** di bagian "Tambah Entitas Baru".
2.  Pilih **"Terhubung ke"** untuk menentukan induk dari entitas baru ini.
3.  Klik:
    - **"Tambah Bawahan"** untuk membuat hubungan hierarkis (atasan-bawahan). Garis penghubung akan solid.
    - **"Tambah Anggota"** untuk membuat hubungan sejajar atau tim. Garis penghubung akan putus-putus.

### 4. Mengedit Entitas
- **Klik dua kali** pada sebuah jabatan di bagan.
- Sebuah form akan muncul di tempatnya. Ubah teks peran dan nama.
- Tekan `Enter` atau klik di luar area form untuk menyimpan perubahan. Tekan `Esc` untuk membatalkan.

### 5. Mengubah Struktur
- **Klik dan tahan** pada sebuah jabatan, lalu geser (drag) ke jabatan lain.
- Lepaskan (drop) di atas jabatan target untuk menjadikannya sebagai bawahan baru.
- Anda tidak bisa menjadikan sebuah jabatan sebagai anak dari turunannya sendiri.

### 6. Menghapus Entitas
- Arahkan kursor ke sebuah jabatan.
- Klik tombol **'X'** berwarna merah yang muncul di pojok kanan atas.
- Jabatan puncak tidak dapat dihapus.

### 7. Mengelola Tampilan
- **Zoom**: Gunakan scroll mouse atau trackpad untuk memperbesar/memperkecil tampilan bagan.
- **Geser (Pan)**: Klik pada area kosong dan geser untuk memindahkan seluruh bagan.
- **Tema**: Pilih tema visual yang Anda sukai di bagian "Tema Visual".

### 8. Ekspor & Impor
- **Ekspor PNG**:
  1. Klik tombol "Ekspor PNG".
  2. Sebuah modal pratinjau akan muncul.
  3. Pilih ukuran kertas yang diinginkan (misalnya, A4 Lanskap). Anda dapat menggeser dan men-zoom pratinjau jika perlu.
  4. Klik "Unduh PNG" untuk menyimpan hasilnya.
- **Ekspor JSON**:
  1. Klik "Ekspor JSON" untuk mengunduh file `.json` yang berisi data struktur Anda saat ini.
- **Impor JSON**:
  1. Klik "Impor JSON".
  2. Pilih file `.json` yang sebelumnya Anda ekspor.
  3. Bagan akan diperbarui sesuai dengan data dari file tersebut.

## 📁 Format Data JSON

Data bagan disimpan dalam format JSON rekursif. Setiap objek "node" memiliki properti berikut:

```json
{
  "id": 1,
  "role": "CEO",
  "name": "Nama CEO",
  "children": [
    {
      "id": 2,
      "role": "CTO",
      "name": "Nama CTO",
      "children": [],
      "members": [
        {
          "id": 3,
          "role": "Frontend Developer",
          "name": "Nama Dev",
          "children": [],
          "members": []
        }
      ]
    }
  ],
  "members": []
}
```
- `id`: ID unik untuk setiap node.
- `role`: Peran atau jabatan.
- `name`: Nama orang yang memegang jabatan.
- `children`: Array berisi node-node yang merupakan bawahan langsung.
- `members`: Array berisi node-node yang merupakan anggota tim atau sejajar.

## 🛠️ Teknologi yang Digunakan

- **D3.js**: Untuk visualisasi data dan simulasi fisika (force-directed graph).
- **Tailwind CSS**: Untuk styling antarmuka pengguna yang responsif.
- **HTML5 & Vanilla JavaScript**: Sebagai fondasi utama aplikasi.

---

Dikembangkan dengan ❤️. Semoga bermanfaat!
