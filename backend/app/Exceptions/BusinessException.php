<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Pelanggaran aturan bisnis (stok kurang, hutang lunas, cancel ganda, dll).
 * Dirender sebagai HTTP 422 dengan pesan yang bisa ditampilkan ke pengguna,
 * bukan HTTP 500.
 */
class BusinessException extends RuntimeException {}
