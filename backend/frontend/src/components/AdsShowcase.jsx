import { getAssetUrl } from '../services/runtime';

export default function AdsShowcase({ ads = [], title = 'Sponsored Highlights' }) {
  if (!ads.length) {
    return null;
  }

  return (
    <section className="ads-showcase">
      <div className="ads-showcase-head">
        <div>
          <div className="workspace-heading">Sponsored</div>
          <h2 className="ads-showcase-title">{title}</h2>
        </div>
      </div>

      <div className="ads-showcase-grid">
        {ads.map((ad) => {
          const Wrapper = ad.link_url ? 'a' : 'div';
          const wrapperProps = ad.link_url
            ? {
                href: ad.link_url,
                rel: 'noreferrer',
                target: '_blank'
              }
            : {};

          return (
            <Wrapper className={`ad-banner-card ${ad.link_url ? 'is-clickable' : ''}`} key={ad.id} {...wrapperProps}>
              <div className="ad-banner-media">
                <img
                  alt={ad.title}
                  src={getAssetUrl(ad.image_url)}
                />
              </div>
              <div className="ad-banner-body">
                <div className="ad-banner-kicker">Featured Campaign</div>
                <h3 className="ad-banner-title">{ad.title}</h3>
                <p className="ad-banner-copy mb-0">{ad.description}</p>
                {ad.link_url ? <span className="ad-banner-cta">Open link</span> : null}
              </div>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}
