document.addEventListener('DOMContentLoaded', function() {
    // --- Elemen UI ---
    const titleInput = document.getElementById('org-title');
    const displayTitle = document.getElementById('display-title');
    const chartContainer = document.getElementById('chart-container');
    const controlsPanel = document.getElementById('controls-panel');
    const closeControlsBtn = document.getElementById('close-controls-btn');

    // --- Variabel Global ---
    let width, height;
    let chartData = { id: 1, role: 'Jabatan Puncak', name: 'Mulai di sini', children: [], members: [] };
    let nextNodeId = 2;

    // --- Manajemen History (Undo/Redo) ---
    let history = [];
    let historyIndex = -1;

    // --- Setup D3.js ---
    const svg = d3.select("#chart-container").append("svg");
    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.1, 3]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(d => d.linkType === 'member' ? 150 : 180).strength(1))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("x", d3.forceX().strength(0.1))
        .force("y", d3.forceY().strength(0.1))
        .force("collision", d3.forceCollide().radius(120));

    const dragHandler = d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);

    function resizeChart() {
        width = chartContainer.clientWidth;
        height = chartContainer.clientHeight;
        svg.attr("width", width).attr("height", height);
        simulation.force("x", d3.forceX(width / 2).strength(0.1));
        simulation.force("y", d3.forceY(height / 2).strength(0.1));
        simulation.alpha(0.3).restart();
    }

    // --- Fungsi Utama ---
    function updateChart() {
        if (!chartData) return;

        const allNodes = [];
        const allLinks = [];

        function flatten(node) {
            allNodes.push(node);
            if (node.children) {
                node.children.forEach(child => {
                    allLinks.push({ source: node.id, target: child.id, linkType: 'child' });
                    flatten(child);
                });
            }
            if (node.members) {
                node.members.forEach(member => {
                    allLinks.push({ source: node.id, target: member.id, linkType: 'member' });
                    flatten(member);
                });
            }
        }
        flatten(chartData);

        g.selectAll('.link').remove();
        g.selectAll('.node-group').remove();

        const link = g.append('g').attr('class', 'links')
            .selectAll('path.link')
            .data(allLinks, d => `${d.source}-${d.target}`)
            .enter().append('path')
            .attr('class', d => `link ${d.linkType}-link`);

        const node = g.append('g').attr('class', 'nodes')
            .selectAll('g.node-group')
            .data(allNodes, d => d.id)
            .enter().append('g')
            .attr('class', 'node-group')
            .call(dragHandler)
            .on('dblclick', (event, d) => { event.stopPropagation(); showEditForm(d); });

        node.append("rect").attr('class', 'node-rect').attr("width", 200).attr("height", 60).attr("x", -100).attr("y", -30).attr("rx", 8);
        node.append("text").attr("class", "node-text-role").attr("dy", "-0.2em").attr("text-anchor", "middle").text(d => d.role);
        node.append("text").attr("class", "node-text-name").attr("dy", "1.2em").attr("text-anchor", "middle").text(d => d.name);

        const deleteBtn = node.append('g').attr('class', 'delete-btn').attr('transform', 'translate(90, -20)').style('display', d => d.id === 1 ? 'none' : null).on('click', (event, d) => { event.stopPropagation(); deleteNode(d.id); });
        deleteBtn.append('circle').attr('r', 10);
        deleteBtn.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').text('X');

        simulation.nodes(allNodes).on("tick", () => {
            link.attr("d", d => `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`);
            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });
        simulation.force("link").links(allLinks);
        simulation.alpha(1).restart();

        populateParentSelector();
        updateHistoryButtons();
    }

    // --- Logika Fitur ---
    function saveState() { history = history.slice(0, historyIndex + 1); history.push(JSON.parse(JSON.stringify(chartData))); historyIndex++; updateHistoryButtons(); }
    function undo() { if (historyIndex > 0) { historyIndex--; chartData = JSON.parse(JSON.stringify(history[historyIndex])); updateChart(); } }
    function redo() { if (historyIndex < history.length - 1) { historyIndex++; chartData = JSON.parse(JSON.stringify(history[historyIndex])); updateChart(); } }

    function findNode(nodeId, root = chartData) {
        if (root.id === nodeId) return root;
        let found = null;
        if (root.children) {
            for (const child of root.children) {
                found = findNode(nodeId, child);
                if (found) return found;
            }
        }
        if (root.members) {
            for (const member of root.members) {
                found = findNode(nodeId, member);
                if (found) return found;
            }
        }
        return null;
    }

    function findParent(nodeId, root = chartData) {
         if (root.id === nodeId) return null; // Root has no parent
         if (root.children) {
            for (const child of root.children) {
                if (child.id === nodeId) return root;
                const found = findParent(nodeId, child);
                if (found) return found;
            }
        }
        if (root.members) {
             for (const member of root.members) {
                if (member.id === nodeId) return root;
                const found = findParent(nodeId, member);
                if (found) return found;
            }
        }
        return null;
    }

    function deleteNode(nodeId) {
        if (nodeId === 1) { alert("Jabatan Puncak tidak bisa dihapus."); return; }
        const parent = findParent(nodeId);
        if(parent) {
            if(parent.children) parent.children = parent.children.filter(c => c.id !== nodeId);
            if(parent.members) parent.members = parent.members.filter(m => m.id !== nodeId);
            saveState();
            updateChart();
        }
    }

    function addNode(type) {
        const newRole = document.getElementById('new-role').value;
        const newName = document.getElementById('new-name').value;
        const parentId = parseInt(document.getElementById('parent-node-select').value);
        if (!newRole || !parentId) { alert("Harap isi Jabatan/Peran dan pilih entitas untuk terhubung."); return; }

        const parentNode = findNode(parentId);
        if (parentNode) {
            const newNode = { id: nextNodeId++, role: newRole, name: newName, children: [], members: [] };

            if (type === 'child') {
                if (!parentNode.children) parentNode.children = [];
                parentNode.children.push(newNode);
            } else if (type === 'member') {
                if (!parentNode.members) parentNode.members = [];
                parentNode.members.push(newNode);
            }

            saveState();
            updateChart();
            document.getElementById('new-role').value = '';
            document.getElementById('new-name').value = '';
        }
    }

    function showEditForm(d) {
        const nodeGroup = d3.selectAll('.node-group').filter(p => p.id === d.id);
        nodeGroup.on('.drag', null);
        nodeGroup.selectAll('text').style('visibility', 'hidden');
        const foreignObject = nodeGroup.append('foreignObject').attr('width', 200).attr('height', 60).attr('x', -100).attr('y', -30);
        const form = foreignObject.append('xhtml:div').style('display', 'flex').style('flex-direction', 'column').style('justify-content', 'center').style('height', '100%').style('padding', '5px');
        const roleInput = form.append('xhtml:input').attr('class', 'edit-form-input').property('value', d.role);
        const nameInput = form.append('xhtml:input').attr('class', 'edit-form-input').style('margin-top', '4px').property('value', d.name);
        roleInput.node().focus();
        const saveAndClose = () => {
            const nodeToUpdate = findNode(d.id);
            nodeToUpdate.role = roleInput.property('value');
            nodeToUpdate.name = nameInput.property('value');
            foreignObject.remove();
            nodeGroup.selectAll('text').style('visibility', 'visible');
            nodeGroup.select('.node-text-role').text(nodeToUpdate.role);
            nodeGroup.select('.node-text-name').text(nodeToUpdate.name);
            nodeGroup.call(dragHandler);
            saveState();
            populateParentSelector();
        };
        form.on('focusout', e => !form.node().contains(e.relatedTarget) && saveAndClose());
        form.on('keydown', e => e.key === 'Enter' ? (e.preventDefault(), saveAndClose()) : e.key === 'Escape' && (foreignObject.remove(), nodeGroup.selectAll('text').style('visibility', 'visible'), nodeGroup.call(dragHandler)));
    }

    // --- Drag & Drop ---
    let draggedNodeData = null;
    function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; draggedNodeData = d; d3.select(this).raise().classed('dragging', true); }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; d3.selectAll('.node-group').classed('drop-target', false); const hovered = d3.select(document.elementFromPoint(event.sourceEvent.clientX, event.sourceEvent.clientY).closest('.node-group')); if (!hovered.empty() && hovered.datum().id !== draggedNodeData.id) { hovered.classed('drop-target', true); } }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d3.select(this).classed('dragging', false);
        const dropTarget = d3.select('.drop-target');

        if (!dropTarget.empty()) {
            const newParentData = dropTarget.datum();
            const oldParent = findParent(draggedNodeData.id);

            // Mencegah drop ke diri sendiri atau ke anak-anaknya sendiri
            let isDescendant = false;
            function checkDescendant(node) {
                if (node.id === newParentData.id) isDescendant = true;
                if (node.children) node.children.forEach(checkDescendant);
                if (node.members) node.members.forEach(checkDescendant);
            }
            checkDescendant(draggedNodeData);

            if (oldParent && oldParent.id !== newParentData.id && !isDescendant) {
                // Hapus dari parent lama
                if(oldParent.children) oldParent.children = oldParent.children.filter(c => c.id !== draggedNodeData.id);
                if(oldParent.members) oldParent.members = oldParent.members.filter(m => m.id !== draggedNodeData.id);

                // Tambahkan ke parent baru (sebagai child secara default)
                if (!newParentData.children) newParentData.children = [];
                newParentData.children.push(draggedNodeData);

                saveState();
                updateChart();
            }
        }

        d.fx = null; d.fy = null;
        draggedNodeData = null;
        d3.selectAll('.node-group').classed('drop-target', false);
    }

    // --- Helper & Event Listeners ---
    function populateParentSelector() {
        const select = document.getElementById('parent-node-select');
        select.innerHTML = '';
        const allNodes = [];
        function flatten(node) { allNodes.push(node); if(node.children) node.children.forEach(flatten); if(node.members) node.members.forEach(flatten); }
        flatten(chartData);
        allNodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `${node.role} (${node.name || 'ID: ' + node.id})`;
            select.appendChild(option);
        });
    }
    function updateHistoryButtons() { document.getElementById('undo-btn').disabled = historyIndex <= 0; document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1; }

    document.getElementById('add-child-btn').addEventListener('click', () => addNode('child'));
    document.getElementById('add-member-btn').addEventListener('click', () => addNode('member'));
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => document.body.dataset.theme = btn.dataset.theme));
    titleInput.addEventListener('input', () => displayTitle.textContent = titleInput.value);

    // --- Kontrol Sidebar Mobile ---
    closeControlsBtn.addEventListener('click', () => controlsPanel.classList.remove('open'));

    // --- Logika Ekspor ---
    const exportModal = document.getElementById('export-modal');
    const paperSizeSelect = document.getElementById('paper-size-select');
    const exportPaper = d3.select("#export-paper");
    const exportSvg = d3.select("#export-svg");

    document.getElementById('export-png-btn').addEventListener('click', () => { exportModal.classList.remove('hidden'); setupExportPreview(); });
    document.getElementById('close-modal-btn').addEventListener('click', () => exportModal.classList.add('hidden'));
    paperSizeSelect.addEventListener('change', setupExportPreview);

    function getInlineStyles(element, pseudo) {
        return window.getComputedStyle(element, pseudo);
    }

    function setupExportPreview() {
        const [pWidth, pHeight] = paperSizeSelect.value.split('x').map(Number);
        exportPaper.style('width', `${pWidth}px`).style('height', `${pHeight}px`);
        exportSvg.attr('width', pWidth).attr('height', pHeight);
        exportSvg.selectAll('*').remove();
        const exportContent = exportSvg.append('g');

        g.selectAll('.link').each(function() {
            const style = getInlineStyles(this);
            exportContent.append('path')
                .attr('d', d3.select(this).attr('d'))
                .attr('stroke', style.getPropertyValue('stroke'))
                .attr('stroke-width', style.getPropertyValue('stroke-width'))
                .attr('stroke-dasharray', style.getPropertyValue('stroke-dasharray'))
                .attr('fill', 'none');
        });

        g.selectAll('.node-group').each(function() {
            const originalNode = d3.select(this);
            const newNode = exportContent.append('g').attr('transform', originalNode.attr('transform'));

            const rect = originalNode.select('.node-rect');
            const rectStyle = getInlineStyles(rect.node());
            newNode.append('rect')
                .attr('x', rect.attr('x')).attr('y', rect.attr('y'))
                .attr('width', rect.attr('width')).attr('height', rect.attr('height'))
                .attr('rx', rect.attr('rx'))
                .attr('fill', rectStyle.getPropertyValue('fill'))
                .attr('stroke', rectStyle.getPropertyValue('stroke'))
                .attr('stroke-width', rectStyle.getPropertyValue('stroke-width'));

            const roleText = originalNode.select('.node-text-role');
            const roleStyle = getInlineStyles(roleText.node());
            newNode.append('text')
                .attr('text-anchor', 'middle').attr('dy', roleText.attr('dy'))
                .text(roleText.text())
                .attr('fill', roleStyle.getPropertyValue('fill'))
                .attr('font-family', roleStyle.getPropertyValue('font-family'))
                .attr('font-size', roleStyle.getPropertyValue('font-size'))
                .attr('font-weight', roleStyle.getPropertyValue('font-weight'));

            const nameText = originalNode.select('.node-text-name');
            const nameStyle = getInlineStyles(nameText.node());
            newNode.append('text')
                .attr('text-anchor', 'middle').attr('dy', nameText.attr('dy'))
                .text(nameText.text())
                .attr('fill', nameStyle.getPropertyValue('fill'))
                .attr('font-family', nameStyle.getPropertyValue('font-family'))
                .attr('font-size', nameStyle.getPropertyValue('font-size'))
                .attr('font-weight', nameStyle.getPropertyValue('font-weight'));
        });

        const mainChartBounds = g.node().getBBox();
        const scale = Math.min((pWidth - 80) / mainChartBounds.width, (pHeight - 120) / mainChartBounds.height);
        const initialX = (pWidth / 2) - (mainChartBounds.x + mainChartBounds.width / 2) * scale;
        const initialY = (pHeight / 2) - (mainChartBounds.y + mainChartBounds.height / 2) * scale + 40;
        const initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(scale);

        exportContent.attr('transform', initialTransform);
        const exportZoom = d3.zoom().on('zoom', (event) => exportContent.attr('transform', event.transform));
        exportSvg.call(exportZoom).call(exportZoom.transform, initialTransform);
    }

    document.getElementById('final-export-btn').addEventListener('click', () => {
        const [pWidth, pHeight] = paperSizeSelect.value.split('x').map(Number);

        const titleStyle = getInlineStyles(displayTitle);
        exportSvg.select('g').insert('text', ':first-child')
            .attr('x', pWidth / 2)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '24px')
            .attr('font-weight', 'bold')
            .attr('fill', titleStyle.getPropertyValue('color'))
            .attr('font-family', titleStyle.getPropertyValue('font-family'))
            .text(displayTitle.textContent);

        const svgString = new XMLSerializer().serializeToString(exportSvg.node());
        const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pWidth;
            canvas.height = pHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = getInlineStyles(document.body).getPropertyValue('background-color');
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${titleInput.value.replace(/ /g, '_') || 'bagan_organisasi'}.png`;
            a.click();
        };
        img.src = url;
    });

    // --- Logika Impor/Ekspor JSON ---
    document.getElementById('export-json-btn').addEventListener('click', () => {
        const jsonString = JSON.stringify(chartData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${titleInput.value.replace(/ /g, '_') || 'bagan'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    document.getElementById('import-json-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Validasi sederhana
                if (importedData.id && importedData.role) {
                    chartData = importedData;
                    let maxId = 0;
                    function findMaxId(node) { if(node.id > maxId) maxId = node.id; if(node.children) node.children.forEach(findMaxId); if(node.members) node.members.forEach(findMaxId); }
                    findMaxId(chartData);
                    nextNodeId = maxId + 1;
                    saveState();
                    updateChart();
                    history = [JSON.parse(JSON.stringify(chartData))];
                    historyIndex = 0;
                    updateHistoryButtons();
                } else {
                    alert("Format JSON tidak valid.");
                }
            } catch (error) {
                alert("Gagal memuat file JSON. Pastikan format file benar.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    });

    // --- Mobile Modal Logic ---
    const mobileAddModal = document.getElementById('mobile-add-modal');
    const navAddBtn = document.getElementById('nav-add-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    navAddBtn.addEventListener('click', () => {
        // Populate the modal's parent selector each time it's opened
        const modalParentSelect = document.getElementById('modal-parent-node-select');
        const currentParentSelect = document.getElementById('parent-node-select');
        modalParentSelect.innerHTML = currentParentSelect.innerHTML;
        modalParentSelect.value = currentParentSelect.value;
        mobileAddModal.classList.add('open');
    });

    modalCloseBtn.addEventListener('click', () => mobileAddModal.classList.remove('open'));
    mobileAddModal.addEventListener('click', (e) => {
        if (e.target === mobileAddModal) {
            mobileAddModal.classList.remove('open');
        }
    });

    document.getElementById('modal-add-child-btn').addEventListener('click', () => addNodeFromModal('child'));
    document.getElementById('modal-add-member-btn').addEventListener('click', () => addNodeFromModal('member'));

    function addNodeFromModal(type) {
        const newRole = document.getElementById('modal-new-role').value;
        const newName = document.getElementById('modal-new-name').value;
        const parentId = parseInt(document.getElementById('modal-parent-node-select').value);
        if (!newRole || !parentId) { alert("Harap isi Jabatan/Peran dan pilih entitas untuk terhubung."); return; }

        addNode(type, newRole, newName, parentId); // Reuse the main addNode logic

        // Clear inputs and close modal
        document.getElementById('modal-new-role').value = '';
        document.getElementById('modal-new-name').value = '';
        mobileAddModal.classList.remove('open');
    }

    // Modify the original addNode to be more reusable
    function addNode(type, role, name, parentId) {
        const parentNode = findNode(parentId);
        if (parentNode) {
            const newNode = { id: nextNodeId++, role: role, name: name, children: [], members: [] };
            if (type === 'child') {
                if (!parentNode.children) parentNode.children = [];
                parentNode.children.push(newNode);
            } else if (type === 'member') {
                if (!parentNode.members) parentNode.members = [];
                parentNode.members.push(newNode);
            }
            saveState();
            updateChart();
        }
    }

    // --- Nav Menu Logic ---
    const navMenuBtn = document.getElementById('nav-menu-btn');
    const navUndoBtn = document.getElementById('nav-undo-btn');
    const navRedoBtn = document.getElementById('nav-redo-btn');

    navMenuBtn.addEventListener('click', () => {
        controlsPanel.classList.add('open');
    });
    navUndoBtn.addEventListener('click', undo);
    navRedoBtn.addEventListener('click', redo);

    // --- Sidebar Add Buttons (for desktop) ---
    document.getElementById('add-child-btn').addEventListener('click', () => {
        const newRole = document.getElementById('new-role').value;
        const newName = document.getElementById('new-name').value;
        const parentId = parseInt(document.getElementById('parent-node-select').value);
        if (!newRole || !parentId) { alert("Harap isi Jabatan/Peran dan pilih entitas untuk terhubung."); return; }
        addNode('child', newRole, newName, parentId);
        document.getElementById('new-role').value = '';
        document.getElementById('new-name').value = '';
    });
    document.getElementById('add-member-btn').addEventListener('click', () => {
        const newRole = document.getElementById('new-role').value;
        const newName = document.getElementById('new-name').value;
        const parentId = parseInt(document.getElementById('parent-node-select').value);
        if (!newRole || !parentId) { alert("Harap isi Jabatan/Peran dan pilih entitas untuk terhubung."); return; }
        addNode('member', newRole, newName, parentId);
        document.getElementById('new-role').value = '';
        document.getElementById('new-name').value = '';
    });


    // Inisialisasi awal
    window.addEventListener('resize', resizeChart);
    displayTitle.textContent = titleInput.value;
    resizeChart();
    saveState();
    updateChart();
});
