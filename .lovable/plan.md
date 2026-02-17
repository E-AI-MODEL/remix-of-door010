

# Vervang DOORai chat door cm.com Halo Platform chatbot

## Wat gaan we doen?

We verwijderen de eigen DOORai chatwidget en het inlog-dashboard, en vervangen dit door de externe chatbot van cm.com (Halo Platform). De homepage krijgt een duidelijke testpagina-banner.

## Wat wordt verwijderd

| Component | Locatie |
|-----------|---------|
| PublicChatWidget (floating DOORai chat) | `src/components/chat/PublicChatWidget.tsx` + verwijzing in `App.tsx` |
| AIWidgetSection (chat-sectie op homepage) | `src/components/home/AIWidgetSection.tsx` + verwijzing in `Index.tsx` |
| DOORai chat pagina | `src/pages/Chat.tsx` + route in `App.tsx` |
| Dashboard pagina | `src/pages/Dashboard.tsx` + route in `App.tsx` |
| Auth pagina | `src/pages/Auth.tsx` + route in `App.tsx` |
| Profile pagina | `src/pages/Profile.tsx` + route in `App.tsx` |
| Backoffice pagina | `src/pages/Backoffice.tsx` + route in `App.tsx` |
| DOORai mascot in Header | Animatie-logica die DOORai hint toont |
| Dashboard/Inloggen knoppen in Header | CTA-knoppen rechtsboven |
| Gerelateerde componenten | `DashboardCards`, `PhaseCard`, `PhaseProgress`, `ProfileHero`, `ProfileTimeline`, etc. |
| Auth context | `src/contexts/AuthContext.tsx` (wordt niet meer gebruikt) |
| Chat hooks | `useChatConversation.ts`, `ChatActions.tsx` |

## Wat wordt toegevoegd

### 1. cm.com Halo Platform chatbot script
Het externe chatbot-script wordt geladen in `index.html`:

```html
<script type="module" crossorigin="anonymous" 
  src="https://webchat.digitalcx.com/inline.js" 
  onload="cmwc.add('b27c3288-ffe3-4717-9b75-23bc222a2cc1').install();">
</script>
```

Dit voegt automatisch een floating chatwidget toe op alle pagina's -- geen extra React-code nodig.

### 2. Testpagina-banner op de homepage
Een opvallende banner bovenaan de homepage die aangeeft dat dit een testomgeving is van het Halo Platform van cm.com. Bijvoorbeeld:

- Gele/oranje balk bovenaan de pagina
- Tekst: "Dit is een testpagina van het Halo Platform van cm.com"
- Optioneel: link naar cm.com documentatie

### 3. Header vereenvoudigen
- Verwijder inlog/dashboard knoppen
- Verwijder DOORai mascot animatie
- Houd navigatielinks (Kennisbank, Opleidingen, Scholen, Agenda, Vacatures)

### 4. Homepage HeroSection aanpassen
- Verwijder "Ontdek jouw route" knop (linkte naar /auth)
- Houd "Bekijk vacatures" knop
- Eventueel toevoegen: knop die de cm.com chatbot opent

## Technische details

### Bestanden die worden verwijderd
- `src/components/chat/PublicChatWidget.tsx`
- `src/components/chat/ChatActions.tsx`
- `src/components/home/AIWidgetSection.tsx`
- `src/components/dashboard/DashboardCards.tsx`
- `src/components/dashboard/PhaseCard.tsx`
- `src/components/dashboard/PhaseProgress.tsx`
- `src/components/profile/*` (alle profile componenten)
- `src/components/backoffice/*` (alle backoffice componenten)
- `src/pages/Chat.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Backoffice.tsx`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useChatConversation.ts`

### Bestanden die worden aangepast
- `index.html` -- cm.com script toevoegen
- `src/App.tsx` -- routes en imports opschonen, AuthProvider en PublicChatWidget verwijderen
- `src/components/layout/Header.tsx` -- inlog/dashboard knoppen en DOORai mascot verwijderen
- `src/pages/Index.tsx` -- AIWidgetSection verwijderen, testbanner toevoegen
- `src/components/home/HeroSection.tsx` -- auth-link verwijderen

### Pagina's die blijven bestaan
- `/` (Homepage)
- `/vacatures`
- `/events`
- `/opleidingen`
- `/kennisbank`
- `/scholen`

