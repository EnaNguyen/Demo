import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
  .use(HttpBackend)          
  .use(LanguageDetector)     
  .init({
    lng: 'en',                
    fallbackLng: 'en',        
    debug: false,             

    interpolation: {
      escapeValue: false     
    },

    backend: {
      loadPath: '/assets/i18n/{{lng}}-{{ns}}.json'  
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18next;