import React, { useState } from 'react';
import axios from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Package,
  Layers,
} from 'lucide-react';

/**
 * MOComponentRequirements Component
 * Displays the required raw material components snapshot for a Manufacturing Order,
 * highlighting stock availability, consumed quantities, and shortages.
 */
export const MOComponentRequirements = ({
  moId,
  components = [],
  availabilityStatus = 'insufficient',
  onAvailabilityRefreshed,
  readOnly = false,
}) => {
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockError, setStockError] = useState(null);

  /**
   * Trigger live component stock check on backend
   */
  const handleCheckLiveStock = async () => {
    if (!moId) return;
    setCheckingStock(true);
    setStockError(null);

    try {
      const baseUrl = endpoints?.manufacturingOrders?.list || '/manufacturing-orders';
      const availabilityUrl = `${baseUrl}/${moId}/availability`;
      const response = await axios.get(availabilityUrl);

      if (response?.data?.data && onAvailabilityRefreshed) {
        onAvailabilityRefreshed(response.data.data);
      }
    } catch (err) {
      console.error('Error rechecking stock availability:', err);
      setStockError(
        err?.response?.data?.message || 'Failed to perform live component stock audit.'
      );
    } finally {
      setCheckingStock(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Raw Material Component Demands
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Snapshot of required raw materials and current stock availability
          </p>
        </div>

        {!readOnly && moId && (
          <button
            type="button"
            onClick={handleCheckLiveStock}
            disabled={checkingStock}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingStock ? 'animate-spin' : ''}`} />
            <span>Check Live Stock</span>
          </button>
        )}
      </div>

      {stockError && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <span>{stockError}</span>
          <button onClick={() => setStockError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Component Table */}
      {components.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-xs font-medium">No component requirements recorded for this order.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                <th className="py-2.5 px-4">Component Raw Material</th>
                <th className="py-2.5 px-4 text-right">Required Qty</th>
                <th className="py-2.5 px-4 text-right">Consumed Qty</th>
                <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                <th className="py-2.5 px-4 text-center">Shortage</th>
                <th className="py-2.5 px-4 text-center">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {components.map((item, idx) => {
                const prod = item.product || {};
                const reqQty = Number(item.requiredQuantity) || 0;
                const consumedQty = Number(item.consumedQuantity) || 0;
                const availStock =
                  item.availableStock !== undefined
                    ? Number(item.availableStock)
                    : Number(prod.stockOnHand || 0);

                const isSufficient =
                  item.sufficientStock !== undefined ? item.sufficientStock : availStock >= reqQty;

                const shortage = Math.max(0, reqQty - availStock);
                const uom = item.unitOfMeasure || prod.unitOfMeasure || 'pcs';

                return (
                  <tr key={item._id || idx} className="hover:bg-gray-50/80 transition-colors">
                    {/* Material */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{prod.name || 'Component Item'}</div>
                      {prod.sku && (
                        <div className="text-[10px] text-gray-400 font-mono">SKU: {prod.sku}</div>
                      )}
                    </td>

                    {/* Required Qty */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {reqQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                      <span className="text-[10px] text-gray-400 font-sans ml-1">{uom}</span>
                    </td>

                    {/* Consumed Qty */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                      {consumedQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                      <span className="text-[10px] text-gray-400 font-sans ml-1">{uom}</span>
                    </td>

                    {/* Stock On Hand */}
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        isSufficient ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {availStock.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                      <span className="text-[10px] text-gray-400 font-sans ml-1">{uom}</span>
                    </td>

                    {/* Shortage */}
                    <td className="py-3 px-4 text-center font-mono">
                      {shortage > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[10px]">
                          -{shortage.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {uom}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isSufficient ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sufficient
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Shortage
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MOComponentRequirements;
