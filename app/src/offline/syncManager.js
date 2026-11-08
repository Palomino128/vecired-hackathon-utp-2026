import { initDB, OUTBOX_STORE } from './db.js';

/**
 * Guarda un registro en el almacén 'outbox' para sincronizarlo cuando vuelva la red.
 * @param {Object} data Datos a almacenar en la cola offline.
 * @returns {Promise<IDBValidKey>} El ID generado para el registro guardado.
 */
export async function saveToOutbox(data) {
  const db = await initDB();
  const item = {
    ...data,
    createdAt: data?.createdAt || new Date().toISOString(),
  };
  return db.add(OUTBOX_STORE, item);
}

/**
 * Lee todos los registros pendientes almacenados en el 'outbox'.
 * @returns {Promise<Array<Object>>} Lista de registros pendientes de sincronización.
 */
export async function getOutboxItems() {
  const db = await initDB();
  return db.getAll(OUTBOX_STORE);
}

