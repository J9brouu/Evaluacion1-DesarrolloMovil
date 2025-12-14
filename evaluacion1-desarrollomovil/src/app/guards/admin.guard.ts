import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService, AppUser } from '../services/user.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const userService = inject(UserService);

  try {
    // Obtener usuario actual del localStorage
    const currentUserJson = localStorage.getItem('app_current_user');
    
    if (!currentUserJson) {
      console.log('No hay usuario en sesión');
      router.navigate(['/login']);
      return false;
    }

    const currentUser = JSON.parse(currentUserJson);
    
    if (!currentUser.id) {
      console.log('Usuario sin ID válido');
      router.navigate(['/login']);
      return false;
    }

    // Obtener los datos completos del usuario desde Firebase
    const usuarios = userService.list();
    const user = usuarios.find(u => u.id === currentUser.id);

    if (!user) {
      console.log('Usuario no encontrado en la base de datos');
      router.navigate(['/login']);
      return false;
    }

    if (userService.isAdmin(user)) {
      console.log('Acceso permitido - Usuario es admin');
      return true;
    }

    console.log('Acceso denegado - Usuario no es admin');
    router.navigate(['/listar']);
    return false;
  } catch (error) {
    console.error('Error en adminGuard:', error);
    router.navigate(['/login']);
    return false;
  }
};
