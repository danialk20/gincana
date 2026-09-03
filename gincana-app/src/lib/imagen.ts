/**
 * Comprime la foto del equipo en el navegador antes de guardarla.
 *
 * Se recorta a cuadrado y se reduce a 600 px, que pesa unos 60-90 KB. Así cabe
 * dentro del propio documento del equipo en Firestore (que admite hasta 1 MB) y
 * no hace falta contratar Firebase Storage, que exige tarjeta de crédito.
 */
export async function comprimirFoto(archivo: File, lado = 600, calidad = 0.7): Promise<string> {
  const bitmap = await crearBitmap(archivo);
  const recorte = Math.min(bitmap.width, bitmap.height);
  const origenX = (bitmap.width - recorte) / 2;
  const origenY = (bitmap.height - recorte) / 2;

  const lienzo = document.createElement('canvas');
  lienzo.width = lado;
  lienzo.height = lado;

  const contexto = lienzo.getContext('2d');
  if (!contexto) throw new Error('No se pudo procesar la imagen en este navegador.');
  contexto.drawImage(bitmap, origenX, origenY, recorte, recorte, 0, 0, lado, lado);

  return lienzo.toDataURL('image/jpeg', calidad);
}

async function crearBitmap(archivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(archivo);
  }
  // Respaldo para navegadores viejos.
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    imagen.src = URL.createObjectURL(archivo);
  });
}

export function pesoAproximado(dataUrl: string): string {
  const bytes = Math.round((dataUrl.length * 3) / 4);
  return `${Math.round(bytes / 1024)} KB`;
}
