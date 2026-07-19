import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './Home.css';

export default function Home() {

  useEffect(() => {
    const items = document.querySelectorAll('.landing-page .reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <header className="hero">
        <nav className="nav">
          <div className="wrap">
            <Link className="logo" to="/">Mor<b>shop</b></Link>
            <div className="links">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#quienes-somos">Quiénes somos</a>
              <a href="#caracteristicas">Características</a>
            </div>
            <div className="actions">
              <Link className="login" to="/login">Iniciar sesión</Link>
              <Link className="nav-cta" to="/login">Crear tienda&nbsp; ↗</Link>
            </div>
          </div>
        </nav>
        
        <div id="inicio" className="wrap hero-content">
          <div>
            <span className="eyebrow"><i></i>La tienda online para emprendedores argentinos</span>
            <h1>Tu tienda.<br/><span>Tu marca.</span><br/>Tu próxima venta.</h1>
            <p>Mostrá tus productos con una identidad que se siente tuya y convertí visitas en conversaciones listas para vender.</p>
            <div className="button-row">
              <Link className="button" to="/login">Crear mi tienda gratis&nbsp; →</Link>
              <a className="button-alt" href="#como-funciona">Descubrir cómo funciona&nbsp; ↓</a>
            </div>
            <div className="proof">
              <span><i></i>100% gratis para siempre</span>
              <span>+1.000 tiendas creadas</span>
            </div>
          </div>
          
          <div className="stage" aria-hidden="true">
            <div className="stage-bg"></div>
            <div className="ring"></div>
            <div className="orb one"></div>
            <div className="orb two"></div>
            <div className="orb three"></div>
            <div className="phone">
              <div className="screen">
                <div className="store-head">
                  <span>‹</span><b>MI MARCA</b><span>⌕ &nbsp; 🛒</span>
                </div>
                <div className="tabs">
                  <b>Productos</b><span>Categorías</span><span>Info</span>
                </div>
                <div className="products">
                  <div className="product">
                    <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=190&q=80" alt="prod" />
                    <span>Runner Solar</span><strong>$ 79.600</strong>
                  </div>
                  <div className="product">
                    <img src="https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=190&q=80" alt="prod" />
                    <span>Denim Claro</span><strong>$ 52.200</strong>
                  </div>
                  <div className="product">
                    <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=190&q=80" alt="prod" />
                    <span>Mochila Nine</span><strong>$ 61.300</strong>
                  </div>
                  <div className="product">
                    <img src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=190&q=80" alt="prod" />
                    <span>Urban Kit</span><strong>$ 59.900</strong>
                  </div>
                </div>
                <div className="wa">● &nbsp; Consultar por WhatsApp</div>
              </div>
            </div>
            <div className="status-card">
              <small>TU MARCA</small><b>Se ve profesional.</b>
              <div className="meter"><i></i></div>
            </div>
          </div>
        </div>
        <div className="curve"></div>
      </header>

      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-item">TU TIENDA. TU MARCA.<b>✦</b>CREÁ. VENDÉ. REPETÍ.<b>✦</b>CATÁLOGOS QUE DAN GANAS DE COMPRAR.<b>✦</b></span>
          <span className="ticker-item">TU TIENDA. TU MARCA.<b>✦</b>CREÁ. VENDÉ. REPETÍ.<b>✦</b>CATÁLOGOS QUE DAN GANAS DE COMPRAR.<b>✦</b></span>
          <span className="ticker-item">TU TIENDA. TU MARCA.<b>✦</b>CREÁ. VENDÉ. REPETÍ.<b>✦</b>CATÁLOGOS QUE DAN GANAS DE COMPRAR.<b>✦</b></span>
          <span className="ticker-item">TU TIENDA. TU MARCA.<b>✦</b>CREÁ. VENDÉ. REPETÍ.<b>✦</b>CATÁLOGOS QUE DAN GANAS DE COMPRAR.<b>✦</b></span>
        </div>
      </div>

      <main>
        <section id="como-funciona" className="section">
          <div className="wrap">
            <div className="intro reveal">
              <div>
                <span className="section-label">Así de simple</span>
                <h2>De una idea a tu tienda en minutos.</h2>
              </div>
              <p>Sin conocimientos técnicos y sin pasos confusos. Morshop te acompaña desde tu primera foto hasta tu primer pedido.</p>
            </div>
            <div className="steps">
              <article className="step reveal delay-1">
                <span className="step-no">01 — CREÁ</span>
                <h3>Dale un nombre<br/>a tu marca.</h3>
                <p>Elegí cómo se llama tu tienda, subí tu logo y hacela sentir tuya desde el primer momento.</p>
                <div className="graphic g-one"></div>
              </article>
              <article className="step reveal delay-1">
                <span className="step-no">02 — MOSTRÁ</span>
                <h3>Subí tus<br/>productos.</h3>
                <p>Fotos, precio, detalles y stock: todo ordenado para que sea fácil elegirte.</p>
                <div className="graphic g-two"></div>
              </article>
              <article className="step reveal delay-2">
                <span className="step-no">03 — VENDÉ</span>
                <h3>Recibí pedidos<br/>por WhatsApp.</h3>
                <p>Tu cliente llega al chat con el producto elegido y listo para consultar.</p>
                <div className="graphic g-three">◔</div>
              </article>
            </div>
          </div>
        </section>

        <section id="caracteristicas" className="section soft">
          <div className="wrap">
            <div className="intro reveal">
              <div>
                <span className="section-label">Hecha para crecer</span>
                <h2>Todo lo que tu marca necesita para vender en serio.</h2>
              </div>
              <p>Diseñamos cada parte para que tus productos se vean mejor, tus clientes decidan más rápido y vos vendas con más tranquilidad.</p>
            </div>
            <div className="feature-grid">
              <article className="feature big reveal">
                <h3>Tu identidad, al frente.</h3>
                <p>Colores, logo, catálogo y una experiencia que hace que tu tienda se vea tan única como tu negocio.</p>
                <div className="big-bag"></div>
              </article>
              <article className="feature reveal delay-1">
                <h3>Catálogo ordenado.</h3>
                <p>Todo claro para vos, y mucho más fácil de explorar para tus clientes.</p>
                <div className="shape tiles"><i></i><i></i><i></i><i></i><i></i><i></i></div>
              </article>
              <article className="feature reveal delay-2">
                <h3>Siempre al día.</h3>
                <p>Actualizá precios, fotos y disponibilidad desde tu celular.</p>
                <div className="shape check">✓</div>
              </article>
              <article className="feature reveal delay-1">
                <h3>Carrito y pedido.</h3>
                <p>Un recorrido simple que mantiene el interés en tus productos.</p>
                <div className="shape cart">🛒</div>
              </article>
              <article className="feature reveal delay-2">
                <h3>Gratis para siempre.</h3>
                <p>Vendé sin comisiones ni costos escondidos que frenen tu negocio.</p>
                <div className="shape check">✓</div>
              </article>
            </div>
          </div>
        </section>

        <section className="section dark">
          <div className="wrap stat-row reveal">
            <div className="statement">Una vitrina abierta<br/>para todo lo que<br/>estás construyendo.</div>
            <div className="stat"><b>100%</b><span>GRATIS PARA EMPEZAR</span></div>
            <div className="stat"><b>24/7</b><span>TU TIENDA ABIERTA</span></div>
            <div className="stat"><b>1 click</b><span>HASTA WHATSAPP</span></div>
          </div>
        </section>

        <section id="quienes-somos" className="section">
          <div className="wrap about">
            <div className="about-art reveal">
              <div className="quote">“Vender online debería sentirse posible para todos.”<small>— EQUIPO MORSHOP</small></div>
              <div className="mini-tag"></div>
            </div>
            <div className="about-text reveal delay-1">
              <span className="section-label">Quiénes somos</span>
              <h2>Creemos que una buena idea merece verse bien.</h2>
              <p>Morshop nació para los emprendedores que construyen algo propio todos los días. Para quienes venden por Instagram, por WhatsApp y por recomendación, pero quieren una tienda que acompañe el tamaño de sus ganas.</p>
              <p>No hacemos tiendas impersonales. Creamos una base simple para que cada marca pueda mostrarse, crecer y vender con confianza.</p>
              <div className="values">
                <div className="value"><i>✦</i>Simple de usar</div>
                <div className="value"><i>✦</i>Hecha en Argentina</div>
                <div className="value"><i>✦</i>Tu identidad primero</div>
                <div className="value"><i>✦</i>Siempre cerca</div>
              </div>
            </div>
          </div>
        </section>

        <section className="quote-section">
          <div className="wrap quote-card reveal">
            <div className="quote-mark">“</div>
            <blockquote>“Antes enviaba fotos y precios por todos lados. Ahora paso un solo link y mi tienda hace el resto.”</blockquote>
            <p>Martina · Tienda de indumentaria · Córdoba</p>
            <div className="slider-dots"><i className="active"></i><i></i><i></i></div>
          </div>
        </section>

        <section className="section">
          <div className="wrap faq">
            <div className="reveal">
              <span className="section-label">Preguntas frecuentes</span>
              <h2>Todo claro desde el comienzo.</h2>
              <p className="section-copy">Si todavía tenés dudas, estas son las preguntas que más nos hacen quienes están por crear su primera tienda.</p>
            </div>
            <div className="reveal delay-1">
              <details open>
                <summary>¿Realmente es gratis?</summary>
                <p>Sí. Podés crear tu tienda y mostrar tus productos sin pagar comisiones por venta ni mensualidades en dólares.</p>
              </details>
              <details>
                <summary>¿Necesito saber de diseño o programación?</summary>
                <p>No. Morshop está pensado para que puedas crear y administrar tu tienda desde el celular, sin conocimientos técnicos.</p>
              </details>
              <details>
                <summary>¿Cómo compran mis clientes?</summary>
                <p>Exploran tu catálogo, eligen lo que quieren y te escriben por WhatsApp con el producto seleccionado.</p>
              </details>
              <details>
                <summary>¿Puedo usar mi propia identidad visual?</summary>
                <p>Sí. Podés personalizar tu tienda con el nombre, logo y estilo que representa a tu marca.</p>
              </details>
            </div>
          </div>
        </section>

        <section id="crear" className="final">
          <div className="wrap">
            <h2>Tu próxima venta puede empezar hoy.</h2>
            <p>Creá una tienda que se vea como tu marca, compartila y empezá a vender sin vueltas.</p>
            <Link className="button" to="/login">Crear mi tienda gratis&nbsp; →</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="logo">Mor<b>shop</b></div>
          <span>Tu tienda. Tu marca. © 2026</span>
        </div>
      </footer>
    </div>
  );
}
