export interface PriceAlert {
  id: number;
  symbol: string;
  price: number;
  condition: 'above' | 'below';
  action: 'notify';
  triggered: boolean;
  createdAt: Date;
}

export class PriceAlertManager {
  alerts: PriceAlert[] = [];

  constructor() {
    this.alerts = [];
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }

  addAlert(symbol: string, price: number, condition: 'above' | 'below' = 'above', action: 'notify' = 'notify'): PriceAlert {
    const alert: PriceAlert = {
      id: Date.now(),
      symbol,
      price,
      condition,
      action,
      triggered: false,
      createdAt: new Date()
    };
    this.alerts.push(alert);
    console.log(`Alert created: ${symbol} ${condition} ${price}`);
    return alert;
  }

  checkAlerts(symbol: string, currentPrice: number): number[] {
    const triggeredIds: number[] = [];
    this.alerts.forEach(alert => {
      if (alert.symbol !== symbol || alert.triggered) return;
      
      const conditionMet = alert.condition === 'above' 
        ? currentPrice >= alert.price 
        : currentPrice <= alert.price;
        
      if (conditionMet) {
        this.triggerAlert(alert);
        triggeredIds.push(alert.id);
      }
    });
    return triggeredIds;
  }

  triggerAlert(alert: PriceAlert) {
    alert.triggered = true;
    const direction = alert.condition === 'above' ? 'above' : 'below';
    const message = `Your alert got triggered on ${alert.symbol} as the price just crossed ${direction} the price level ${alert.price}.`;
    
    if (alert.action === 'notify') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("TradeZilla Alert", { body: message });
      } else {
        window.alert(message);
      }
      console.log(message);
    }
  }

  getAlerts() {
    return this.alerts;
  }

  deleteAlert(id: number) {
    this.alerts = this.alerts.filter(a => a.id !== id);
  }

  resetAlerts() {
    this.alerts.forEach(a => (a.triggered = false));
  }
}
