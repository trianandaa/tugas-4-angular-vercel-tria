import { CommonModule } from '@angular/common'; // Mengimpor CommonModule agar dapat menggunakan fitur-fitur dasar Angular seperti *ngIf dan *ngFor
import { Component, OnInit, inject } from '@angular/core'; // Mengimpor dekorator Component, lifecycle hook OnInit, dan inject untuk injeksi HttpClient pada komponen standalone
import { HttpClient } from '@angular/common/http'; // Mengimpor HttpClient untuk melakukan HTTP request
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // Tambahkan untuk menangani formulir
import * as bootstrap from 'bootstrap';
import { NgxPaginationModule } from 'ngx-pagination'; // Impor modul ngx-pagination

@Component({
  selector: 'app-fakultas', // Nama selector untuk komponen ini. Komponen akan digunakan di template dengan tag <app-fakultas></app-fakultas>
  standalone: true, // Menyatakan bahwa komponen ini adalah komponen standalone dan tidak membutuhkan module tambahan
  imports: [CommonModule, ReactiveFormsModule, NgxPaginationModule], // Mengimpor CommonModule untuk memungkinkan penggunaan direktif Angular standar seperti *ngIf dan *ngFor di template
  templateUrl: './fakultas.component.html', // Path ke file template HTML untuk komponen ini
  styleUrl: './fakultas.component.css', // Path ke file CSS untuk komponen ini
})
export class FakultasComponent implements OnInit {
  // Deklarasi komponen dengan mengimplementasikan lifecycle hook OnInit
  fakultas: any[] = []; // Mendeklarasikan properti fakultas yang akan menyimpan data yang diterima dari API
  currentPage = 1;
  itemsPerPage = 5;
  apiUrl = 'https://crud-express-seven.vercel.app/api/fakultas'; // URL API yang digunakan untuk mendapatkan data fakultas
  isLoading = true; // Properti untuk status loading, digunakan untuk menunjukkan loader saat data sedang diambil

  fakultasForm: FormGroup; // Tambahkan untuk mengelola data formulir
  isSubmitting = false; // Status untuk mencegah double submit

  private http = inject(HttpClient); // Menggunakan inject untuk mendapatkan instance HttpClient di dalam komponen standalone (untuk Angular versi terbaru yang mendukung pendekatan ini)

  private fb = inject(FormBuilder); // Inject FormBuilder untuk membuat FormGroup

  constructor() {
    // Inisialisasi form dengan kontrol nama dan singkatan
    this.fakultasForm = this.fb.group({
      nama: [''],
      singkatan: [''],
    });
  }

  ngOnInit(): void {
    // Lifecycle hook ngOnInit dipanggil saat komponen diinisialisasi
    this.getFakultas(); // Memanggil method getFakultas saat komponen diinisialisasi
  }

  getFakultas(): void {
    // Method untuk mengambil data fakultas dari API
    // Mengambil data dari API menggunakan HttpClient
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        // Callback untuk menangani data yang diterima dari API
        this.fakultas = data; // Menyimpan data yang diterima ke dalam properti fakultas
        console.log('Data Fakultas:', this.fakultas); // Mencetak data fakultas di console untuk debugging
        this.isLoading = false; // Mengubah status loading menjadi false, yang akan menghentikan tampilan loader
      },
      error: (err) => {
        // Callback untuk menangani jika terjadi error saat mengambil data
        console.error('Error fetching fakultas data:', err); // Mencetak error di console untuk debugging
        this.isLoading = false; // Tetap mengubah status loading menjadi false meskipun terjadi error, untuk menghentikan loader
      },
    });
  }

  // Method untuk menambahkan fakultas
  addFakultas(): void {
    if (this.fakultasForm.valid) {
      this.isSubmitting = true; // Set status submitting
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}`};
      this.http.post(this.apiUrl, this.fakultasForm.value,{headers}).subscribe({
        next: (response) => {
          console.log('Data berhasil ditambahkan:', response);
          this.getFakultas(); // Refresh data fakultas
          this.fakultasForm.reset(); // Reset formulir
          this.isSubmitting = false; // Reset status submitting

          // Tutup modal setelah data berhasil ditambahkan
          const modalElement = document.getElementById(
            'tambahFakultasModal'
          ) as HTMLElement;
          if (modalElement) {
            const modalInstance =
              bootstrap.Modal.getInstance(modalElement) ||
              new bootstrap.Modal(modalElement);
            modalInstance.hide();

            // Hapus elemen backdrop jika ada
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }

            // Pulihkan scroll pada body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          }
        },
        error: (err) => {
          console.error('Error menambahkan fakultas:', err);
          this.isSubmitting = false;
        },
      });
    }
  }

  // Method untuk menampilkan modal edit fakultas
  editFakultasId: string | null = null; // ID fakultas yang sedang diubah

  // Method untuk mendapatkan data fakultas berdasarkan ID
  getFakultasById(_id: string): void {
    this.editFakultasId = _id; //Menyimpan ID Fakultas yang dipilih
    this.http.get(`${this.apiUrl}/${_id}`).subscribe({
      next: (data: any) => {
        // Isi form dengan data yang diterima dari API
        this.fakultasForm.patchValue({
          nama: data.nama,
          singkatan: data.singkatan,
        });

        // Buka modal edit
        const modalElement = document.getElementById(
          'editFakultasModal'
        ) as HTMLElement;
        if (modalElement) {
          const modalInstance =
            bootstrap.Modal.getInstance(modalElement) ||
            new bootstrap.Modal(modalElement);
          modalInstance.show();
        }
      },
      error: (err) => {
        console.error('Error fetching fakultas data by ID:', err);
      },
    });
  }

  // Method untuk mengupdate fakultas
  updateFakultas(): void {
    if (this.fakultasForm.valid) {
      this.isSubmitting = true;
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}`};
      this.http
        .put(`${this.apiUrl}/${this.editFakultasId}`, this.fakultasForm.value,{headers})
        .subscribe({
          next: (response) => {
            console.log('Fakultas berhasil diperbarui:', response);
            this.getFakultas(); // Refresh data fakultas
            this.isSubmitting = false;

            // Tutup modal edit setelah data berhasil diupdate
            const modalElement = document.getElementById(
              'editFakultasModal'
            ) as HTMLElement;
            if (modalElement) {
              const modalInstance = bootstrap.Modal.getInstance(modalElement);
              modalInstance?.hide();
            }
          },
          error: (err) => {
            console.error('Error updating fakultas:', err);
            this.isSubmitting = false;
          },
        });
    }
  }

  // Method untuk menghapus fakultas
  deleteFakultas(id: string): void {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}`};
      // Konfirmasi Penghapusan
      this.http.delete(`${this.apiUrl}/${id}`,{headers}).subscribe({
        next: (response) => {
          console.log('Data berhasil dihapus:', response);
          this.getFakultas(); // Refresh data fakultas
        },
        error: (err) => {
          console.error('Error menghapus fakultas:', err);
        },
      });
    }
  }
}
