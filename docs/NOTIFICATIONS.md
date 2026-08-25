# Pluggable Notification Delivery Providers in MoneyMind

MoneyMind decouples notification generation from delivery channels. External contributors can add custom providers (such as SMS, Slack hooks, Telegram bots) by creating a provider module.

---

## 1. Creating a Provider

All notification providers extend the abstract base class:
`backend/src/modules/notifications/providers/NotificationProvider.js`

Example (`backend/src/modules/notifications/providers/SlackProvider.js`):
```javascript
import NotificationProvider from './NotificationProvider.js';

export class SlackProvider extends NotificationProvider {
  constructor() {
    super('slack');
  }

  async send({ userId, type, title, message, refId }) {
    // Implement Slack webhook POST logic here
    console.log(`[SlackProvider] Sent Slack notification to user ${userId}`);
    return true;
  }
}

export default SlackProvider;
```

---

## 2. Registering a Provider

To register the provider, import and instantiate it inside the registry registry class:
`backend/src/modules/notifications/providers/Registry.js`

```javascript
import SlackProvider from './SlackProvider.js';

// Inside constructor:
this.register(new SlackProvider());
```

The system automatically handles failures. If one provider throws an error, other registered providers still attempt delivery.
