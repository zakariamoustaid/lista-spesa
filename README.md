# Shopping List

Piccola PWA personale per preparare la lista, consultarla durante la spesa e conservare i dati sul dispositivo. L’archivio e la lista corrente sono salvati nel LocalStorage; non c’è un account o un server applicativo.

## Stack

React, TypeScript, Vite, CSS, LocalStorage, Vite PWA Plugin, Lucide React e Vitest.

## Installazione e avvio

```sh
npm install
npm run dev
```

Vite ascolta su tutte le interfacce di rete. `localhost` è accessibile direttamente solo dal dispositivo sul quale gira il server. Da un iPhone sulla stessa rete si può aprire `http://IP-LOCALE-DEL-COMPUTER:5173` per controllare l’interfaccia; sostituire l’indirizzo con l’IP mostrato dalle impostazioni di rete del computer.

## Build e anteprima

```sh
npm run build
npm run preview
```

La build produce i file statici in `dist/`. Per eseguire i test delle funzioni di persistenza: `npm test`.

## Pubblicazione su GitHub Pages

Il repository `lista-spesa` è configurato per pubblicare automaticamente il sito con GitHub Actions quando viene aggiornato il branch `main`. Il workflow sostituisce il controllo Deno iniziale con `npm ci`, `npm test`, `npm run build` e la pubblicazione della cartella `dist/`.

Per attivare Pages, nelle impostazioni del repository aprire **Settings → Pages** e selezionare **GitHub Actions** come sorgente di pubblicazione. Poi inviare le modifiche al branch `main`; lo stato e l’URL sono visibili nella scheda **Actions**. Per questo repository l’indirizzo atteso è `https://zakariamoustaid.github.io/lista-spesa/`.

La configurazione usa il percorso `/lista-spesa/` solo durante la build GitHub Actions; `npm run dev` e le build locali continuano a funzionare da `/`.

**Visibilità:** GitHub Pages è pubblico anche se il repository sorgente è privato, salvo configurazioni GitHub Enterprise specifiche. Il sito non contiene autenticazione. I dati della spesa restano nel LocalStorage del browser e non vengono sincronizzati tra dispositivi, ma chiunque raggiunga il sito può usare la propria copia dell’app. Se serve limitare chi può aprire il sito, usare un hosting con controllo accessi.

## Test e installazione su iPhone

Safari su iPhone può raggiungere il server di sviluppo usando l’indirizzo IP locale, ma una pagina servita via HTTP da un IP di rete non è un contesto sicuro: non fare affidamento su Service Worker, installazione PWA o funzionamento offline in questa modalità. `localhost` è considerato sicuro solo sul dispositivo stesso, non quando il server gira su un computer diverso.

Per provare la PWA completa, pubblicare la cartella `dist/` su un hosting statico HTTPS oppure servirla da un server HTTPS accessibile nella rete locale con certificato attendibile per iPhone. Aprire l’URL HTTPS in Safari, attendere il primo caricamento (e la registrazione del Service Worker), quindi usare **Condividi → Aggiungi alla schermata Home**. Avviare l’icona dalla Home per la visualizzazione standalone. Su iOS/iPadOS la PWA si installa dalla condivisione di Safari; non è previsto un prompt d’installazione automatico. I dati restano nel LocalStorage del contesto installato e offline è disponibile l’app dopo il primo caricamento completato.

## Funzioni

- Archivio prodotti con ricerca, aggiunta da tastiera, modifica ed eliminazione coerente dalla lista.
- Lista senza duplicati, prodotti acquistati e ancora da acquistare, rimozione rapida.
- Modalità spesa con swipe verso destra o pulsante, avanzamento, annullamento temporaneo e conferma prima di svuotare la lista.
- Cache offline delle risorse statiche tramite service worker generato da Vite PWA.
