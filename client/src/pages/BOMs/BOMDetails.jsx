import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import endpoints from '../../api/endpoints';
import {
  X,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit,
  DollarSign,
  Activity,
  Clock,
  Wrench,
  Loader2,
  Boxes,
  Cpu,
  Calculator,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { dashboardUtils } from '../Dashboard/dashboard.utils';

export const BOMDetails = ({ bomId, isOpen, onClose, onEdit }) => {
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Requirement calculation simulator state
  const [calcQuantity, setCalcQuantity] = useState(10);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  useEffect(() => {
    if (!bomId || !isOpen) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setBom(null);
      setCalcResult(null);

      try {
        const baseUrl = endpoints?.boms?.list || '/boms';
        const bomUrl = endpoints?.boms?.getById
          ? endpoints.boms.getById(bomId)
          : `${baseUrl}/${bomId}`;

        const response = await axios.get(bomUrl);
        const data = response?.data?.data || response?.data;
        setBom(data);
        if (data?.quantity) {
          setCalcQuantity(data.quantity * 10);
        }
      } catch (err) {
        console.error('Error fetching BOM details:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load BOM details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bomId, isOpen]);

  // Calculate dynamic requirements for given quantity using backend endpoint
  const handleCalculate = async () => {
    if (!bomId || !calcQuantity || Number(calcQuantity) <= 0) return;

    setCalcLoading(true);
    setCalcError(null);

    try {
      const baseUrl = endpoints?.boms?.list || '/boms';
      const calcUrl = endpoints?.boms?.calculateRequirements
        ? endpoints.boms.calculateRequirements(bomId)
        : `${baseUrl}/${bomId}/calculate-requirements`;

      const res = await axios.post(calcUrl, { quantity: Number(calcQuantity) });
      const resultData = res?.data?.data || res?.data;
      setCalcResult(resultData);
    } catch (err) {
      console.error('Error calculating BOM requirements:', err);
      setCalcError(err?.response?.data?.message || 'Failed to calculate material requirements.');
    } finally {
      setCalcLoading(false);
    }
  };

  if (!isOpen) return null;

  const finishedProd = bom?.finishedProduct || {};

  return (
    <div className="mms-modal-overlay" onClick={onClose}>
      <div className="mms-modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl border border-purple-200">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {finishedProd.name || 'Bill of Materials'}
                </h2>
                {bom?.code && (
                  <span className="px-2 py-0.5 font-mono text-xs font-bold bg-purple-100 text-purple-800 rounded">
                    {bom.code}
                  </span>
                )}
                {bom?.version && (
                  <span className="px-2 py-0.5 font-mono text-[10px] font-semibold bg-gray-200 text-gray-700 rounded">
                    v{bom.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manufacturing Specification & Material Formula
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
              <p className="text-xs font-medium">Loading Bill of Materials details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" /> Error Loading Details
              </div>
              <p>{error}</p>
            </div>
          ) : bom ? (
            <>
              {/* VISUAL BOM FLOW DIAGRAM */}
              <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-emerald-50 rounded-xl border border-purple-100/80">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-600" /> Manufacturing Hierarchy Overview
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  {/* Finished Product Card */}
                  <div className="flex-1 w-full bg-white p-3 rounded-lg border border-purple-200 shadow-2xs">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-600 block">
                      Target Output Product
                    </span>
                    <span className="font-bold text-gray-900 text-sm block truncate">
                      {finishedProd.name || 'Product'}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Base Batch: {bom.quantity || 1} {finishedProd.unitOfMeasure || 'pcs'}
                    </span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 hidden sm:block" />

                  {/* Components Count Card */}
                  <div className="flex-1 w-full bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 block">
                      Required Components
                    </span>
                    <span className="font-bold text-gray-900 text-sm block">
                      {bom.components?.length || 0} Material Item(s)
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Raw materials & parts
                    </span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 hidden sm:block" />

                  {/* Operations Count Card */}
                  <div className="flex-1 w-full bg-white p-3 rounded-lg border border-blue-200 shadow-2xs">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 block">
                      Work Center Operations
                    </span>
                    <span className="font-bold text-gray-900 text-sm block">
                      {bom.operations?.length || 0} Routing Step(s)
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Est. Total:{' '}
                      {bom.operations?.reduce((sum, o) => sum + (o.durationMinutes || 0), 0) || 0} mins
                    </span>
                  </div>
                </div>
              </div>

              {/* HEADER INFO GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px]">
                    BOM Code
                  </span>
                  <span className="font-mono font-bold text-gray-900">{bom.code}</span>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px]">
                    Output Quantity
                  </span>
                  <span className="font-bold text-gray-900 font-mono">
                    {dashboardUtils.formatNumber(bom.quantity, 2)} {finishedProd.unitOfMeasure || 'pcs'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px]">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                      bom.isActive ? 'mms-bom-status-active' : 'mms-bom-status-inactive'
                    }`}
                  >
                    {bom.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-red-600" /> Inactive
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px]">
                    Product SKU
                  </span>
                  <span className="font-mono font-bold text-gray-800">{finishedProd.sku || 'N/A'}</span>
                </div>
              </div>

              {/* NOTES */}
              {bom.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-500" /> Process & Engineering Notes
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed">
                    {bom.notes}
                  </div>
                </div>
              )}

              {/* COMPONENTS BREAKDOWN */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-emerald-600" /> Bill of Materials Components ({bom.components?.length || 0})
                </h3>

                {(!bom.components || bom.components.length === 0) ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 text-center">
                    No component items attached to this Bill of Materials.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Component Product Name</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3 text-right">Required Qty</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">Stock On Hand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {bom.components.map((comp, idx) => {
                          const prod = typeof comp.product === 'object' ? comp.product : {};
                          const stock = prod?.stockOnHand ?? 0;
                          const hasSufficient = stock >= comp.quantity;

                          return (
                            <tr key={comp._id || idx} className="hover:bg-gray-50">
                              <td className="py-2.5 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-gray-900">{prod.name || 'Component'}</td>
                              <td className="py-2.5 px-3 font-mono text-gray-500">{prod.sku || '-'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                                {dashboardUtils.formatNumber(comp.quantity, 4)}
                              </td>
                              <td className="py-2.5 px-3 text-center text-gray-500 font-mono">
                                {comp.unitOfMeasure || prod.unitOfMeasure || 'pcs'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
                                    hasSufficient
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {hasSufficient ? (
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                                  )}
                                  {dashboardUtils.formatNumber(stock)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* OPERATIONS & ROUTING */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-600" /> Work Center Routing Operations ({bom.operations?.length || 0})
                </h3>

                {(!bom.operations || bom.operations.length === 0) ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 text-center">
                    No work center operations configured for this BOM routing.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                          <th className="py-2.5 px-3 w-12 text-center">Seq</th>
                          <th className="py-2.5 px-3">Operation Name</th>
                          <th className="py-2.5 px-3">Work Center Station</th>
                          <th className="py-2.5 px-3 text-right">Est. Duration</th>
                          <th className="py-2.5 px-3 text-right">WC Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {bom.operations.map((op, idx) => {
                          const wc = typeof op.workCenter === 'object' ? op.workCenter : {};

                          return (
                            <tr key={op._id || idx} className="hover:bg-gray-50">
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-700 bg-purple-50/50">
                                #{op.sequence || idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-gray-900">{op.name}</td>
                              <td className="py-2.5 px-3 text-gray-700">
                                {wc.name || 'Work Center'}{' '}
                                {wc.code && <span className="font-mono text-[10px] text-gray-400">({wc.code})</span>}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-900">
                                {op.durationMinutes || 60} mins
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                                ${dashboardUtils.formatNumber(wc.costPerHour ?? 0, 2)}/hr
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* DYNAMIC REQUIREMENTS CALCULATOR PREVIEW */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Production Requirement Calculator
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Simulate component demand and routing duration for target order size
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(e.target.value)}
                      className="w-24 px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white font-mono font-bold outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleCalculate}
                      disabled={calcLoading}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
                    >
                      {calcLoading ? 'Calculating...' : 'Calculate'}
                    </button>
                  </div>
                </div>

                {calcError && (
                  <p className="text-xs text-red-400 font-medium">{calcError}</p>
                )}

                {calcResult && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                      <div>
                        Target Quantity:{' '}
                        <strong className="text-white font-mono">{calcResult.manufacturingQuantity}</strong>
                      </div>
                      <div>
                        Base Ratio:{' '}
                        <strong className="text-white font-mono">
                          {(calcResult.manufacturingQuantity / (calcResult.baseBOMQuantity || 1)).toFixed(2)}x
                        </strong>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                      <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="p-2">Component</th>
                            <th className="p-2 text-right">Required Qty</th>
                            <th className="p-2 text-right">Stock On Hand</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                          {calcResult.components?.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50">
                              <td className="p-2 font-sans font-medium text-slate-100">{c.productName}</td>
                              <td className="p-2 text-right font-bold text-purple-300">
                                {c.requiredQuantity} {c.unitOfMeasure}
                              </td>
                              <td className="p-2 text-right text-slate-400">{c.stockOnHand}</td>
                              <td className="p-2 text-center font-sans font-semibold">
                                {c.sufficientStock ? (
                                  <span className="text-emerald-400 text-[10px]">✓ Available</span>
                                ) : (
                                  <span className="text-amber-400 text-[10px]">⚠ Shortage</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="pt-3 border-t border-gray-100 flex justify-between text-[11px] text-gray-400">
                <span>Created: {dashboardUtils.formatDate(bom.createdAt, true)}</span>
                <span>Updated: {dashboardUtils.formatDate(bom.updatedAt, true)}</span>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          {bom && onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(bom);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Bill of Materials</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BOMDetails;
