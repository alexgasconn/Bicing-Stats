# Bicing Wrapped (No Oficial) 🚲🎁

Visualitza les teves estadístiques del Bicing de Barcelona de forma privada, detallada i interactiva.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Privadesa](https://img.shields.io/badge/Privadesa-Local%20Only-green)

## 📌 Què és això?

**Bicing Wrapped** és una aplicació web que agafa els fitxers d'exportació de **Smou** (l'app oficial) i genera un informe anual (o històric) del teu ús de la bicicleta compartida. Com que Bicing no ofereix un resum anual oficial com fa Spotify, aquesta eina omple aquest buit.

Inclou:
*   📊 **KPIs:** Total de Km, Temps, Racha màxima i Estalvi de CO2.
*   📅 **Mapa de calor anual** (estil GitHub) per veure la teva constància diària.
*   ⚡ **Mecànica vs Elèctrica:** Analitza quin tipus de bici fas servir més.
*   🕒 **Anàlisi d'hàbits:** Hores punta, dies preferits, estacionalitat mensual. **(Nou!)** Filtra per tipus de bici per veure com canvien els teus hàbits.
*   🚲 **Flota:** Descobreix quines bicis has repetit més, cerca per ID i veu el teu "àlbum de cromos" de bicicletes.
*   💰 **Calculadora de costos:** Quant et costa realment cada viatge (incloent la quota anual i extres).

## 🔒 Privadesa

**Tota la màgia passa al teu navegador.**
Els fitxers Excel/CSV que puges **NO** s'envien a cap servidor. El processament és 100% *Client-Side*. Pots desconnectar internet abans de pujar el fitxer i l'aplicació seguirà funcionant perfectament. Les teves dades no surten mai del teu dispositiu.

## 🚀 Com col·laborar

El projecte està organitzat per ser fàcil d'entendre i estendre.

### Estructura de Carpetes

*   `components/`: Elements de la UI (Gràfics, Targetes, Vistes).
    *   `views/`: Les 3 pestanyes principals (`Wrapped`, `Evolució`, `Flota`).
*   `hooks/`: Lògica de negoci.
    *   `useBicingStats.ts`: Aquí és on passa tota la matemàtica. Transforma la llista de viatges en estadístiques.
*   `utils/`: Parsers per llegir els fitxers XLS/CSV bruts de Smou.
*   `data/`: Dades estàtiques (IDs de bicis elèctriques/mecàniques).
*   `types.ts`: Definicions de TypeScript.

### Instal·lació

Aquest projecte utilitza React + Vite.

1.  Clonar el repositori.
2.  `npm install`
3.  `npm run dev`

### Idees per millorar

*   Afegir suport per a mapes (si Smou exportés coordenades en el futur).
*   Millorar l'estimació de distància basada en rutes reals (més complex).
*   Afegir mode fosc.

## 📄 Llicència

Projecte Open Source no oficial. No afiliat a Bicing, Ajuntament de Barcelona o Smou.