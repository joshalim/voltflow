
import { InfluxConfig, EVTransaction, EVCharger, Connector } from '../types';

export const influxService = {
  async writePoint(config: InfluxConfig, line: string) {
    if (!config.isEnabled || !config.url) return;
    
    const url = `${config.url}/api/v2/write?org=${config.org}&bucket=${config.bucket}&precision=s`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${config.token}`,
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: line
      });
      
      if (!response.ok) {
        console.error('InfluxDB write failed:', await response.text());
      }
    } catch (error) {
      console.error('InfluxDB network error:', error);
    }
  },

  // Telemetry: charger,connector=C1 power=42.5,voltage=400,temp=38 timestamp
  async writeTelemetry(config: InfluxConfig, charger: EVCharger, connector: Connector) {
    const timestamp = Math.floor(Date.now() / 1000);
    const line = `telemetry,charger_id=${charger.id},connector_id=${connector.id} ` +
                 `power_kw=${connector.currentPowerKW || 0},` +
                 `energy_kwh=${connector.currentKWh || 0},` +
                 `voltage_v=${connector.voltage || 0},` +
                 `temp_c=${connector.temperature || 0} ` +
                 `${timestamp}`;
    
    await this.writePoint(config, line);
  },

  // Transaction: transactions,station=S1,account=U1 energy=5.2,cost=6500 timestamp
  async writeTransaction(config: InfluxConfig, tx: EVTransaction) {
    const timestamp = Math.floor(new Date(tx.endTime).getTime() / 1000);
    const line = `transactions,station=${tx.station.replace(/ /g, '_')},` +
                 `account=${tx.account.replace(/ /g, '_')},` +
                 `connector=${tx.connector} ` +
                 `energy_kwh=${tx.meterKWh},` +
                 `cost_cop=${tx.costCOP},` +
                 `duration_min=${tx.durationMinutes} ` +
                 `${timestamp}`;
    
    await this.writePoint(config, line);
  },

  // Metadata: metadata,type=user id="...",payload="{...}" timestamp
  async writeMetadata(config: InfluxConfig, type: string, id: string, payload: any) {
    const timestamp = Math.floor(Date.now() / 1000);
    const safePayload = JSON.stringify(payload).replace(/"/g, '\\"');
    const line = `metadata,type=${type},id=${id} payload="${safePayload}" ${timestamp}`;
    await this.writePoint(config, line);
  },

  async query(config: InfluxConfig, flux: string) {
    if (!config.isEnabled || !config.url) return null;
    
    const url = `${config.url}/api/v2/query?org=${config.org}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${config.token}`,
          'Content-Type': 'application/vnd.flux',
          'Accept': 'application/csv',
        },
        body: flux
      });
      
      if (!response.ok) return null;
      return await response.text();
    } catch (error) {
      return null;
    }
  },

  async checkHealth(config: InfluxConfig): Promise<boolean> {
    if (!config.url) return false;
    try {
      const response = await fetch(`${config.url}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
