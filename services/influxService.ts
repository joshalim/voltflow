
import { InfluxConfig, EVTransaction, EVCharger, Connector } from '../types';

export const influxService = {
  normalizeUrl(url: string): string {
    let normalized = url.trim();
    if (!normalized) return '';
    // Ensure protocol exists
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'http://' + normalized;
    }
    // Remove trailing slash
    return normalized.replace(/\/+$/, '');
  },

  async writePoint(config: InfluxConfig, line: string): Promise<{ success: boolean; error?: string }> {
    if (!config.isEnabled) return { success: false, error: 'InfluxDB is disabled' };
    
    const baseUrl = this.normalizeUrl(config.url);
    if (!baseUrl) return { success: false, error: 'Invalid URL' };

    const url = `${baseUrl}/api/v2/write?org=${encodeURIComponent(config.org)}&bucket=${encodeURIComponent(config.bucket)}&precision=${config.precision || 's'}`;
    
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
        const text = await response.text();
        console.error('InfluxDB write failed:', text);
        return { success: false, error: `HTTP ${response.status}: ${text}` };
      }
      return { success: true };
    } catch (error) {
      console.error('InfluxDB network error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },

  async writeTelemetry(config: InfluxConfig, charger: EVCharger, connector: Connector) {
    const timestamp = Math.floor(Date.now() / (config.precision === 'ms' ? 1 : 1000));
    const prefix = config.measurementPrefix || '';
    const line = `${prefix}telemetry,charger_id=${charger.id},connector_id=${connector.id} ` +
                 `power_kw=${connector.currentPowerKW || 0},` +
                 `energy_kwh=${connector.currentKWh || 0},` +
                 `voltage_v=${connector.voltage || 0},` +
                 `temp_c=${connector.temperature || 0} ` +
                 `${timestamp}`;
    
    return await this.writePoint(config, line);
  },

  async writeTransaction(config: InfluxConfig, tx: EVTransaction) {
    const timestamp = Math.floor(new Date(tx.endTime).getTime() / (config.precision === 'ms' ? 1 : 1000));
    const prefix = config.measurementPrefix || '';
    const line = `${prefix}transactions,station=${tx.station.replace(/ /g, '_')},` +
                 `account=${tx.account.replace(/ /g, '_')},` +
                 `connector=${tx.connector} ` +
                 `energy_kwh=${tx.meterKWh},` +
                 `cost_cop=${tx.costCOP},` +
                 `duration_min=${tx.durationMinutes} ` +
                 `${timestamp}`;
    
    return await this.writePoint(config, line);
  },

  async checkHealth(config: InfluxConfig): Promise<{ healthy: boolean; message: string }> {
    const baseUrl = this.normalizeUrl(config.url);
    if (!baseUrl) return { healthy: false, message: 'URL is required' };
    
    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        return { healthy: true, message: `Connected (Status: ${data.status})` };
      }
      return { healthy: false, message: `Status: ${response.status}` };
    } catch (error) {
      return { healthy: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  },

  async testWritePermissions(config: InfluxConfig): Promise<{ success: boolean; message: string }> {
    const testPoint = `_test_connection,host=webapp status="ok" ${Math.floor(Date.now() / (config.precision === 'ms' ? 1 : 1000))}`;
    const result = await this.writePoint(config, testPoint);
    if (result.success) {
      return { success: true, message: 'Write access verified' };
    }
    return { success: false, message: result.error || 'Write failed' };
  }
};
