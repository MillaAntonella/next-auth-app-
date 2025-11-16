'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/signIn' })}
      className="text-white py-2 px-4 rounded bg-gray-600 hover:bg-red-500 transition"
    >
      Cerrar Sesión
    </button>
  );
}
