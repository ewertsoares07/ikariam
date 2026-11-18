import * as c from '../js/calc.js';
import * as p from '../js/parser.js';
const ok = (cond, msg) => console.log(cond ? '✔' : '✘', msg);
ok(c.distancia('96:71','96:71') === 0.5, 'mesma ilha = 0.5');
ok(Math.abs(c.distancia('96:71','93:75') - 5) < 1e-9, 'dist 3-4-5');
let t = c.tempoViagem({ dist: 1, vel: 60 }); ok(t.seg === 1200, 'mercante 1 ilha = 20 min -> ' + t.seg);
t = c.tempoViagem({ dist: 0.5, vel: 60 }); ok(t.seg === 600, 'mesma ilha = 10 min -> ' + t.seg);
t = c.tempoViagem({ dist: 1, vel: 40 }); ok(t.seg === 1800, 'trirreme 1 ilha = 30 min');
t = c.tempoViagem({ dist: 1, vel: 60, poseidon: 5 }); ok(t.seg === 600, 'poseidon 5 dobra -> ' + t.seg);
ok(c.velocidadeGrupo(['hoplita','gigante']) === 40, 'grupo misto = mais lento');
ok(c.velocidadeGrupo(['girocoptero']) === 60, 'giro cruzando mar limitado a 60');
ok(c.velocidadeGrupo(['girocoptero'], false) === 80, 'giro mesma ilha 80');
ok(Math.abs(c.corrupcao(2, 3)) < 1e-9, 'capital+2 col, residencia 2 = 0%');
ok(Math.abs(c.corrupcao(1, 3) - 1/3) < 1e-9, 'residencia 1 c/ 3 cidades = 33%');
ok(c.nivelSemCorrupcao(12) === 11, '12 cidades -> nivel 11');
const agora = Date.now();
let v = c.vinhoAgora({ estoque: 1200, consumo: 100, em: agora - 2*3.6e6 }, agora);
ok(v.restante === 1000 && Math.round(v.segRest) === 36000 && v.nivel === 'vermelho', 'vinho 10h restantes vermelho');
ok(c.nivelVinho(30*3600) === 'amarelo' && c.nivelVinho(3*86400) === 'ok' && c.nivelVinho(8*86400) === 'verde', 'semaforo');
let r = c.reposicaoVinho(100, 7, 1000, 500); ok(r.precisa === 15800 && r.barcos === 32, 'reposicao 7 dias');
let e = c.resumoExercito({ hoplita: 100, trirreme: 10 }, true);
ok(e.generais === 100*1.4 + 10*5 && e.manutReal === (300+150)*2 && e.peso === 500, 'resumo exército ' + JSON.stringify(e));
let s = c.saque({ madeira: 1000, vinho: 500, ouro: 99999 }, 50, 500); ok(s.total === 750 && s.barcos === 2, 'saque ignora ouro');
let ab = c.melhorAbissal([{nome:'A', peso: 5, dano: 10, efic: 100, disponivel: 300},{nome:'B', peso: 30, dano: 75, efic: 120, disponivel: 10}], 1000);
ok(ab.peso <= 1000, 'abissal respeita 1000 -> ' + JSON.stringify(ab));
ok(c.analisarComposicao('mar', { submergivel: 10, lancharapida: 5 })[0].nivel === 'erro', 'naval sem principal = erro');
ok(c.flancoNaval({ vida: 154*30, upAtk: 0, forja: 1, armForja: 0, upArm: 0 }).n.toFixed(3) === (4620/1320).toFixed(3), 'flanco formula');
// parser
const rel = `Relatório de espionagem - Cidade Fulano [93:24]
Madeira 12.345   Vinho 3.000
Mármore: 8.900 Cristal 1,2k Enxofre 45.678 Ouro 1.000.000
Muralha da cidade (Nível 18)
Hoplita 400 Gigantes a Vapor 30 Aríete a Vapor 25 Aríete 12 Lança-Chamas 50 Cozinheiro 10`;
const lr = p.lerRelatorio(rel);
console.log(JSON.stringify(lr));
ok(lr.recursos.madeira === 12345 && lr.recursos.marmore === 8900 && lr.recursos.cristal === 1200 && lr.recursos.ouro === 1000000, 'recursos');
ok(lr.unidades.arietevapor === 25 && lr.unidades.ariete === 12 && lr.unidades.gigante === 30 && lr.unidades.lancachamas === 50, 'unidades');
ok(lr.muralha === 18 && lr.coords === '93:24', 'muralha e coords');
const tab = "Hoplita\tGigante a Vapor\tCarabineiro\n3.976\t150\t1.250";
console.log('tabela:', JSON.stringify(p.lerUnidades(tab)));
