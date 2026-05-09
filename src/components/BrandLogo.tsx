import logo from '../../icons/mycloudai-small.png';

interface BrandLogoProps {
  compact?: boolean;
}

export default function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        alt="MyCloudAI 标志"
        className={compact ? 'h-9 w-9 rounded-2xl object-cover shadow-product' : 'h-11 w-11 rounded-[18px] object-cover shadow-product'}
        src={logo}
      />
      <div>
        <p className="font-display text-[18px] font-semibold tracking-[-0.03em] text-white">MyCloudAI</p>
        {!compact ? <p className="text-[12px] tracking-[0.16em] text-sky">价值投资工具</p> : null}
      </div>
    </div>
  );
}