import React, { useState } from 'react';

function DataMapPanel({ onAddNode }) {
  const [mapConfig, setMapConfig] = useState({
    name: '',
    mappings: [{ from: '', to: '' }]
  });

  const addMapping = () => {
    setMapConfig({
      ...mapConfig,
      mappings: [...mapConfig.mappings, { from: '', to: '' }]
    });
  };

  const updateMapping = (index, field, value) => {
    const newMappings = [...mapConfig.mappings];
    newMappings[index][field] = value;
    setMapConfig({ ...mapConfig, mappings: newMappings });
  };

  const removeMapping = (index) => {
    const newMappings = mapConfig.mappings.filter((_, i) => i !== index);
    setMapConfig({ ...mapConfig, mappings: newMappings });
  };

  const addDataMapNode = () => {
    const name = mapConfig.name || '資料映射';
    onAddNode('data-map', {
      label: name,
      name,
      mappings: mapConfig.mappings.filter(m => m.from && m.to)
    });
    setMapConfig({ name: '', mappings: [{ from: '', to: '' }] });
  };

  return (
    <div className="node-config">
      <h4>🔄 資料映射</h4>
      <input 
        placeholder="映射名稱"
        value={mapConfig.name}
        onChange={(e) => setMapConfig({...mapConfig, name: e.target.value})}
      />
      
      <div style={{margin: '10px 0'}}>
        <strong>欄位對應：</strong>
        {mapConfig.mappings.map((mapping, index) => (
          <div key={index} className="mapping-row">
            <input 
              placeholder="來源欄位"
              value={mapping.from}
              onChange={(e) => updateMapping(index, 'from', e.target.value)}
              className="mapping-input"
            />
            <span className="mapping-arrow">→</span>
            <input 
              placeholder="目標欄位"
              value={mapping.to}
              onChange={(e) => updateMapping(index, 'to', e.target.value)}
              className="mapping-input"
            />
            {mapConfig.mappings.length > 1 && (
              <button 
                onClick={() => removeMapping(index)}
                className="remove-mapping-btn"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={addMapping} className="add-mapping-btn">
          + 新增對應
        </button>
      </div>
      
      <button onClick={addDataMapNode} disabled={!mapConfig.name}>
        ⚡ 新增資料映射
      </button>
    </div>
  );
}

export default DataMapPanel;