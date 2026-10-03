"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "cn"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  sideOffset = 8,
  ...props
}: PopoverPrimitive.Popup.Props & PopoverPrimitive.Positioner.Props) {
  const { side, align, alignOffset, anchor, collisionBoundary, collisionPadding, ...popupProps } =
    props as PopoverPrimitive.Positioner.Props & PopoverPrimitive.Popup.Props
  return (
    <PopoverPrimitive.Portal data-slot="popover-portal">
      <PopoverPrimitive.Positioner
        side={side}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        anchor={anchor}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 w-72 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...popupProps}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
