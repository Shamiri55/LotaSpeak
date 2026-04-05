import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-hot-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleAppError(error: any, context?: string) {
  console.error(`[${context || 'App Error'}]`, error);

  let message = "Une erreur inattendue s'est produite. Veuillez réessayer.";

  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    message = "Erreur de connexion. Vérifiez votre internet.";
  } else if (error?.message?.includes('permission-denied')) {
    message = "Vous n'avez pas la permission d'effectuer cette action.";
  } else if (error?.message?.includes('quota exceeded')) {
    message = "Limite d'utilisation atteinte. Réessayez demain.";
  } else if (error?.message?.includes('API key not valid')) {
    message = "Erreur de configuration de l'IA. Contactez le support.";
  } else if (typeof error === 'string') {
    message = error;
  }

  toast.error(message, {
    duration: 5000,
    position: 'top-center',
    style: {
      borderRadius: '16px',
      background: '#1e293b',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: '14px',
      border: '2px solid #ef4444'
    }
  });

  return message;
}
