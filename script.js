let tableData = [];
let currentPage = 1;
const rowsPerPage = 10;

function handleFileUpload() {
  const fileInput = document.getElementById('xlsxInput');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converte os dados e normaliza os nomes das colunas
        tableData = XLSX.utils.sheet_to_json(worksheet).map((row) => {
          // Normaliza os nomes das colunas para garantir consistência
          return {
            'Certidão Número':
              row['Certidão Número'] || row['CDA'] || row['Certidão'] || '',
            'Nome do Contribuinte': row['Nome do Contribuinte'] || '',
            'CPF/CNPJ': row['CPF/CNPJ'] || 'Não informado',
            Endereço: row['Endereço'] || '',
            'Total (Valor atual)':
              row['Total (Valor atual)'] || 'Não informado',
            status: 'Pendente',
          };
        });

        displayTable();
        updateDashboard();
        showToast('Dados importados com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        showToast('Erro ao processar o arquivo. Verifique o formato.', 'error');
      }
    };
    reader.onerror = function () {
      showToast('Erro ao ler o arquivo.', 'error');
    };
    reader.readAsArrayBuffer(file);
  }
}

function displayTable() {
  const table = document
    .getElementById('dataTable')
    .getElementsByTagName('tbody')[0];
  table.innerHTML = '';
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = tableData.slice(start, end);

  pageData.forEach((row, index) => {
    const newRow = table.insertRow();
    newRow.className = `table-row-hover ${
      row.status === 'Pendente' ? 'status-pending' : 'status-completed'
    }`;

    // Verifica e formata os dados
    const certidao =
      row['Certidão Número'] || row['CDA'] || row['Certidão'] || '';
    const nome = row['Nome do Contribuinte'] || '';
    const cpf = row['CPF/CNPJ'] || '';
    const endereco = row['Endereço'] || '';
    const valor = row['Total (Valor atual)'] || '';

    newRow.innerHTML = `
            <td class="align-middle">
                <span class="fw-semibold">${certidao}</span>
            </td>
            <td class="align-middle">
                <span class="fw-semibold">${nome}</span>
            </td>
            <td class="align-middle">
                <span>${cpf}</span>
            </td>
            <td class="align-middle">
                <div class="text-wrap">
                    ${endereco}
                </div>
            </td>
            <td class="align-middle text-end fw-bold">
                ${valor}
            </td>
            <td class="align-middle">
                <span class="badge ${
                  row.status === 'Pendente' ? 'bg-warning' : 'bg-success'
                }">${row.status}</span>
            </td>
            <td class="align-middle">
                <div class="btn-group" role="group">
                    <button class="btn btn-primary btn-sm" 
                            onclick="generatePetition(${start + index})"
                            title="Gerar Petição">
                        <i class="bx bx-file-blank"></i>
                        <span class="d-none d-md-inline ms-1">Petição</span>
                    </button>
                    <button class="btn btn-${
                      row.status === 'Pendente' ? 'success' : 'warning'
                    } btn-sm" 
                            onclick="toggleStatus(${start + index})"
                            title="${
                              row.status === 'Pendente' ? 'Concluir' : 'Reabrir'
                            }">
                        <i class="bx bx-${
                          row.status === 'Pendente' ? 'check' : 'refresh'
                        }"></i>
                        <span class="d-none d-md-inline ms-1">
                            ${
                              row.status === 'Pendente' ? 'Concluir' : 'Reabrir'
                            }
                        </span>
                    </button>
                </div>
            </td>
        `;
  });

  displayPagination();
  scrollToTable();
}

function displayPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  // Adiciona botão "Anterior"
  pagination.innerHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage - 1
            }, event)">
                <i class="bx bx-chevron-left"></i>
            </a>
        </li>
    `;

  // Lógica para mostrar páginas ao redor da página atual
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    pagination.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1, event)">1</a>
            </li>
            ${
              startPage > 2
                ? '<li class="page-item disabled"><span class="page-link">...</span></li>'
                : ''
            }
        `;
  }

  for (let i = startPage; i <= endPage; i++) {
    pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}, event)">${i}</a>
            </li>
        `;
  }

  if (endPage < totalPages) {
    pagination.innerHTML += `
            ${
              endPage < totalPages - 1
                ? '<li class="page-item disabled"><span class="page-link">...</span></li>'
                : ''
            }
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}, event)">${totalPages}</a>
            </li>
        `;
  }

  // Adiciona botão "Próximo"
  pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage + 1
            }, event)">
                <i class="bx bx-chevron-right"></i>
            </a>
        </li>
    `;
}

function changePage(page, event) {
  if (event) {
    event.preventDefault();
  }
  if (page < 1 || page > Math.ceil(tableData.length / rowsPerPage)) {
    return;
  }
  currentPage = page;
  displayTable();
}

function generatePetition(index) {
  const data = tableData[index];
  if (!data) {
    showToast('Erro ao gerar petição: dados não encontrados', 'error');
    return;
  }

  // Se tem CPF/CNPJ gera petição normal, se não tem gera alternativa
  if (data['CPF/CNPJ'] && data['CPF/CNPJ'] !== 'Não informado') {
    const petitionText = `
        <div class="petition-content" style="text-align: justify; font-family: Arial, sans-serif; line-height: 1.5;">
          <p style="text-align: right;">AO JUÍZO DA VARA CÍVEL DA COMARCA DE MARANGUAPE-CE</p>
   
          <h3 style="text-align: center; margin-bottom: 15px;">EXECUÇÃO FISCAL</h3>
   
          <p>
              O MUNICÍPIO DE MARANGUAPE, pessoa jurídica de direito público interno, inscrito no CNPJ sob nº 07.963.051/0001-68, com endereço no Palácio da Intendência – Gabinete do Prefeito, Rua Major Napoleão Lima, nº 253, Centro, CEP n° 61940-180, por seus Procuradores Judiciais ao final subscritos, vem, respeitosamente, perante Vossa Excelência, propor em face de <strong>${
                data['Nome do Contribuinte']
              }</strong>, CPF/CNPJ: <strong>${
      data['CPF/CNPJ']
    }</strong>, com endereço na <strong>${
      data['Endereço']
    }</strong>, ação de EXECUÇÃO FISCAL DE DÍVIDA ATIVA, proveniente de débito consubstanciado na seguinte Certidão de Inscrição em Dívida Ativa nº <strong>${
      data['Certidão Número']
    }</strong>, que integra a presente petição inicial.
          </p>
   
          <p>Para tanto, requer:</p>
   
          <ol>
              <li style="margin-bottom: 10px;">A citação da parte devedora, por via postal, com Aviso de Recepção (AR), para pagar, no prazo legal, a dívida inscrita, devidamente atualizada, acrescida de juros, custas e despesas processuais, honorários advocatícios e outros encargos incidentes de que tratam a legislação tributária correlata, ou nomear bens livres e desembaraçados para garantir a execução em consonância com a legislação em vigor, sob pena de lhe serem penhorados ou arrestados tantos bens quanto bastem à plena execução da dívida;</li>
   
              <li style="margin-bottom: 10px;">Não paga a dívida ou não garantida a execução, a expedição, por via eletrônica, de ordem de bloqueio de dinheiro em depósito ou aplicação financeira, nos termos dos artigos 185-A, do Código Tributário Nacional e 854, do Código de Processo Civil e, restando infrutífera, a expedição de mandado de penhora e avaliação a recair sobre tantos bens quanto bastem à garantia integral da dívida, inclusive, imóveis, nesse caso, procedendo-se à intimação do cônjuge e à notificação do cartório de registro competente.</li>
          </ol>
   
          <p>
              Atribui-se à causa o valor atualizado de <strong>${
                data['Total (Valor atual)']
              }</strong> (${valorPorExtenso(
      data['Total (Valor atual)']
    )}), consoante o disposto no art. 6º, §4º, da Lei de Execuções Fiscais.
          </p>
   
          <p>
              Por oportuno, requer a juntada da Certidão da Dívida Ativa nº <strong>${
                data['Certidão Número']
              }</strong>, bem como do Termo de Inscrição Consolidado.
          </p>
   
          <p style="text-align: left; margin-top: 20px;">
              Nestes termos,<br>
              Pede deferimento.
          </p>
   
          <p style="text-align: left; margin-top: 20px;">
              Maranguape-CE, ${new Date().toLocaleDateString('pt-BR')}
          </p>
   
          <p style="text-align: left; margin-top: 40px;">
   <strong>Francisco Regis Freitas Matos</strong><br>
   Procurador-Geral do Município de Maranguape<br>
   OAB/CE nº 9.750
</p>

<p style="text-align: left; margin-top: 20px;">
   <strong>Edmar Nunes</strong><br>
   Assessor Jurídico<br>
   OAB/CE n° 31.552
</p>
        </div>
      `;

    try {
      document.getElementById('petitionText').innerHTML = petitionText;
      const petitionModal = new bootstrap.Modal(
        document.getElementById('petitionModal')
      );
      petitionModal.show();
    } catch (error) {
      console.error('Erro ao gerar petição:', error);
      showToast('Erro ao gerar petição. Por favor, tente novamente.', 'error');
    }
  } else {
    // Gera petição sem CPF/CNPJ com fundamentação legal
    const petitionText = `
        <div class="petition-content" style="text-align: justify; font-family: Arial, sans-serif; line-height: 1.5;">
          <p style="text-align: right;">AO JUÍZO DA VARA CÍVEL DA COMARCA DE MARANGUAPE-CE</p>
   
          <h3 style="text-align: center; margin-bottom: 15px;">EXECUÇÃO FISCAL</h3>
   
          <p>
              O MUNICÍPIO DE MARANGUAPE, pessoa jurídica de direito público interno, inscrito no CNPJ sob nº 07.963.051/0001-68, com endereço no Palácio da Intendência – Gabinete do Prefeito, Rua Major Napoleão Lima, nº 253, Centro, CEP n° 61940-180, por seus Procuradores Judiciais ao final subscritos, vem, respeitosamente, perante Vossa Excelência, propor em face de <strong>${
                data['Nome do Contribuinte']
              }</strong>, com endereço na <strong>${
      data['Endereço']
    }</strong>, ação de EXECUÇÃO FISCAL DE DÍVIDA ATIVA, nos seguintes termos:
          </p>
   
          <p>
              Ab initio, cumpre destacar que a presente execução fiscal atende aos requisitos estabelecidos no Código Tributário Nacional, bem como na Lei Federal nº. 6.830/80 - Lei de Execução Fiscal, observando-se e aplicando todas as formalidades do título executivo, sendo este líquido, certo e exigível.
          </p>
   
          <p>
              Reza o artigo 6º da Lei nº. 6.830/80 – LEF:
          </p>
   
          <blockquote style="margin-left: 20px; font-style: italic;">
              "Art. 6º - A petição inicial indicará apenas:<br>
              I - o Juiz a quem é dirigida;<br>
              II - o pedido; e<br>
              III - o requerimento para a citação."
          </blockquote>
   
          <p>
              Por sua vez, a Certidão de Dívida Ativa que instrui a inicial deverá conter os mesmos elementos do Termo de Inscrição em Dívida Ativa, nos moldes do § 5º, do art. 2º da lei supracitada, dentre os quais não se encontra elencado o CPF ou CNPJ do executado.
          </p>
   
          <p>
              Mesmo que aplicando-se os requisitos do art. 319 do CPC, ainda assim não seria admissível o indeferimento da petição inicial por ausência dos dados qualitativos faltantes, conforme dispõe o § 2º do citado artigo:
          </p>
   
          <blockquote style="margin-left: 20px; font-style: italic;">
              "§ 2º A petição inicial não será indeferida se, a despeito da falta de informações a que se refere o inciso II, for possível a citação do réu."
          </blockquote>
   
          <p>
              Cumpre destacar o teor da Súmula 558 do Superior Tribunal de Justiça: "Em ações de execução fiscal, a petição inicial não pode ser indeferida sob o fundamento da ausência de indicação do CPF e/ou RG ou CNPJ do executado."
          </p>
   
          <p>
              O débito executado está consubstanciado na Certidão de Dívida Ativa nº <strong>${
                data['Certidão Número']
              }</strong>, que segue anexa e integra a presente petição inicial para todos os fins de direito.
          </p>
   
          <p>Para tanto, requer:</p>
   
          <ol>
              <li style="margin-bottom: 10px;">A citação da parte devedora, por via postal, com Aviso de Recepção (AR), para pagar, no prazo legal, a dívida inscrita, devidamente atualizada, acrescida de juros, custas e despesas processuais, honorários advocatícios e outros encargos incidentes de que tratam a legislação tributária correlata, ou nomear bens livres e desembaraçados para garantir a execução em consonância com a legislação em vigor, sob pena de lhe serem penhorados ou arrestados tantos bens quanto bastem à plena execução da dívida;</li>
   
              <li style="margin-bottom: 10px;">Não paga a dívida ou não garantida a execução, a expedição, por via eletrônica, de ordem de bloqueio de dinheiro em depósito ou aplicação financeira, nos termos dos artigos 185-A, do Código Tributário Nacional e 854, do Código de Processo Civil e, restando infrutífera, a expedição de mandado de penhora e avaliação a recair sobre tantos bens quanto bastem à garantia integral da dívida, inclusive, imóveis, nesse caso, procedendo-se à intimação do cônjuge e à notificação do cartório de registro competente.</li>
          </ol>
   
          <p>
              Atribui-se à causa o valor atualizado de <strong>${
                data['Total (Valor atual)']
              }</strong> (${valorPorExtenso(
      data['Total (Valor atual)']
    )}), consoante o disposto no art. 6º, §4º, da Lei de Execuções Fiscais.
          </p>
   
          <p>
              Por oportuno, requer a juntada da Certidão da Dívida Ativa nº <strong>${
                data['Certidão Número']
              }</strong>, bem como do Termo de Inscrição Consolidado.
          </p>
   
          <p style="text-align: left; margin-top: 20px;">
              Nestes termos,<br>
              Pede deferimento.
          </p>
   
          <p style="text-align: left; margin-top: 20px;">
              Maranguape-CE, ${new Date().toLocaleDateString('pt-BR')}
          </p>
   
          <p style="text-align: left; margin-top: 40px;">
   <strong>Francisco Regis Freitas Matos</strong><br>
   Procurador-Geral do Município de Maranguape<br>
   OAB/CE nº 9.750
</p>

<p style="text-align: left; margin-top: 20px;">
   <strong>Edmar Nunes</strong><br>
   Assessor Jurídico<br>
   OAB/CE n° 31.552
</p>
        </div>
      `;

    try {
      document.getElementById('petitionText').innerHTML = petitionText;
      const petitionModal = new bootstrap.Modal(
        document.getElementById('petitionModal')
      );
      petitionModal.show();
    } catch (error) {
      console.error('Erro ao gerar petição:', error);
      showToast('Erro ao gerar petição. Por favor, tente novamente.', 'error');
    }
  }
}

function toggleStatus(index) {
  if (tableData[index]) {
    tableData[index].status =
      tableData[index].status === 'Pendente' ? 'Concluída' : 'Pendente';
    displayTable();
    updateDashboard();
    showToast(
      `Petição ${tableData[index].status.toLowerCase()} com sucesso!`,
      'success'
    );
  }
}

function updateDashboard() {
  const totalCount = tableData.length;
  const completedCount = tableData.filter(
    (row) => row.status === 'Concluída'
  ).length;
  const pendingCount = totalCount - completedCount;
  const totalValue = tableData.reduce((sum, row) => {
    const value = String(row['Total (Valor atual)'])
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    return sum + (parseFloat(value) || 0);
  }, 0);

  document.getElementById('totalPetitions').textContent = totalCount;
  document.getElementById('pendingPetitions').textContent = pendingCount;
  document.getElementById('completedPetitions').textContent = completedCount;
  document.getElementById(
    'totalValue'
  ).textContent = `R$ ${totalValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function searchTable() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filteredData = tableData.filter(
    (row) =>
      String(row['Certidão Número']).toLowerCase().includes(searchTerm) ||
      String(row['Nome do Contribuinte']).toLowerCase().includes(searchTerm) ||
      String(row['CPF/CNPJ']).toLowerCase().includes(searchTerm)
  );
  displayFilteredTable(filteredData);
}

function filterTable(status) {
  let filteredData;
  if (status === 'all') {
    filteredData = tableData;
  } else if (status === 'completed') {
    filteredData = tableData.filter((row) => row.status === 'Concluída');
  } else {
    filteredData = tableData.filter((row) => row.status === 'Pendente');
  }
  displayFilteredTable(filteredData);
}

function displayFilteredTable(filteredData) {
  const table = document
    .getElementById('dataTable')
    .getElementsByTagName('tbody')[0];
  table.innerHTML = '';

  filteredData.forEach((row, index) => {
    const newRow = table.insertRow();
    newRow.className = `table-row-hover ${
      row.status === 'Pendente' ? 'status-pending' : 'status-completed'
    }`;

    newRow.innerHTML = `
            <td class="align-middle">
                <span class="fw-semibold">${row['Certidão Número'] || ''}</span>
            </td>
            <td class="align-middle">
                <span class="fw-semibold">${
                  row['Nome do Contribuinte'] || ''
                }</span>
            </td>
            <td class="align-middle">
                <span>${row['CPF/CNPJ'] || ''}</span>
            </td>
            <td class="align-middle">
                <div class="text-wrap">
                    ${row['Endereço'] || ''}
                </div>
            </td>
            <td class="align-middle text-end fw-bold">
                ${row['Total (Valor atual)'] || ''}
            </td>
            <td class="align-middle">
                <span class="badge ${
                  row.status === 'Pendente' ? 'bg-warning' : 'bg-success'
                }">${row.status}</span>
            </td>
            <td class="align-middle">
                <div class="btn-group" role="group">
                    <button class="btn btn-primary btn-sm" 
                            onclick="generatePetition(${index})"
                            title="Gerar Petição">
                        <i class="bx bx-file-blank"></i>
                        <span class="d-none d-md-inline ms-1">Petição</span>
                    </button>
                    <button class="btn btn-${
                      row.status === 'Pendente' ? 'success' : 'warning'
                    } btn-sm" 
                            onclick="toggleStatus(${index})"
                            title="${
                              row.status === 'Pendente' ? 'Concluir' : 'Reabrir'
                            }">
                        <i class="bx bx-${
                          row.status === 'Pendente' ? 'check' : 'refresh'
                        }"></i>
                        <span class="d-none d-md-inline ms-1">
                            ${
                              row.status === 'Pendente' ? 'Concluir' : 'Reabrir'
                            }
                        </span>
                    </button>
                </div>
            </td>
        `;
  });
}

function showToast(message, type = 'info') {
  const icon =
    type === 'success'
      ? 'bx-check-circle'
      : type === 'error'
      ? 'bx-x-circle'
      : 'bx-info-circle';

  Toastify({
    node: (() => {
      const node = document.createElement('div');
      node.innerHTML = `
                <div class="toastify-content">
                    <i class="bx ${icon} toastify-icon"></i>
                    <div class="toastify-text">${message}</div>
                </div>
            `;
      return node;
    })(),
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
    className: `rounded toast-${type}`,
    stopOnFocus: true,
    onClick: function () {}, // Prevents auto-dismissal on click
  }).showToast();
}

function copyPetitionText() {
  const petitionText = document.getElementById('petitionText').innerHTML;
  const blob = new Blob([`<html><body>${petitionText}</body></html>`], {
    type: 'text/html',
  });
  const clipboardItem = new ClipboardItem({ 'text/html': blob });

  navigator.clipboard.write([clipboardItem]).then(
    () => {
      showToast('Texto da petição copiado com sucesso!', 'success');
    },
    () => {
      showToast('Erro ao copiar o texto da petição.', 'error');
    }
  );
}

function scrollToTable() {
  const tableElement = document.getElementById('dataTable');
  if (tableElement) {
    tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function valorPorExtenso(valor) {
  const unidades = [
    '',
    'um',
    'dois',
    'três',
    'quatro',
    'cinco',
    'seis',
    'sete',
    'oito',
    'nove',
  ];
  const dezenas = [
    '',
    'dez',
    'vinte',
    'trinta',
    'quarenta',
    'cinquenta',
    'sessenta',
    'setenta',
    'oitenta',
    'noventa',
  ];
  const dez_a_dezenove = [
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const centenas = [
    '',
    'cento',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];

  function converterGrupo(numero) {
    let resultado = '';

    // Tratamento especial para 100
    if (numero === 100) {
      return 'cem';
    }

    // Centenas
    if (numero >= 100) {
      resultado += centenas[Math.floor(numero / 100)] + ' ';
      numero %= 100;
    }

    // Dezenas e unidades
    if (numero >= 10) {
      if (numero < 20) {
        resultado += dez_a_dezenove[numero - 10];
        return resultado.trim();
      } else {
        resultado += dezenas[Math.floor(numero / 10)] + ' ';
        numero %= 10;
      }
    }

    // Unidades
    if (numero > 0) {
      resultado += unidades[numero];
    }

    return resultado.trim();
  }

  function converterMilhoes(numero) {
    const milhoes = Math.floor(numero / 1000000);
    if (milhoes > 0) {
      return milhoes === 1 ? 'um milhão' : converterGrupo(milhoes) + ' milhões';
    }
    return '';
  }

  function converterMilhares(numero) {
    const milhares = Math.floor((numero % 1000000) / 1000);
    if (milhares > 0) {
      return milhares === 1 ? 'um mil' : converterGrupo(milhares) + ' mil';
    }
    return '';
  }

  // Limpar e formatar o valor de entrada
  valor = valor.toString().replace('R$', '').trim();
  const partes = valor.split(',');
  let reais = parseInt(partes[0].replace(/\./g, ''));
  let centavos = partes[1] ? parseInt(partes[1].padEnd(2, '0')) : 0;

  if (reais === 0 && centavos === 0) {
    return 'zero reais';
  }

  let extenso = '';

  // Converter reais
  if (reais > 0) {
    const milhoes = converterMilhoes(reais);
    const milhares = converterMilhares(reais);
    const centenas = converterGrupo(reais % 1000);

    extenso =
      [milhoes, milhares, centenas].filter((parte) => parte !== '').join(' ') +
      (reais === 1 ? ' real' : ' reais');
  }

  // Converter centavos
  if (centavos > 0) {
    if (reais > 0) extenso += ' e ';
    extenso +=
      converterGrupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  // Capitalizar primeira letra
  return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
  // Event listeners
  document
    .getElementById('xlsxInput')
    .addEventListener('change', handleFileUpload);
  document.getElementById('searchInput').addEventListener('input', searchTable);

  // Event listeners para os botões de filtro
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => filterTable(button.dataset.filter));
  });

  // Inicialização do dashboard
  updateDashboard();
});
