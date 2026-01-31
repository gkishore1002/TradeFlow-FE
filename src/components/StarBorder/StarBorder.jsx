import './StarBorder.css';

const StarBorder = ({
    as: Component = 'div',
    className = '',
    color = '#f15f26',
    speed = '6s',
    thickness = 1,
    children,
    ...rest
}) => {
    return (
        <Component
            className={`star-border-container ${className}`}
            style={{
                padding: `${thickness}px`,
                ...rest.style
            }}
            {...rest}
        >
            <div
                className="border-gradient-bottom"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)`,
                    animationDuration: speed
                }}
            ></div>
            <div
                className="border-gradient-top"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)`,
                    animationDuration: speed
                }}
            ></div>
            <div className="inner-content">{children}</div>
        </Component>
    );
};

export default StarBorder;
