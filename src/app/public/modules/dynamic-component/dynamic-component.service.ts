import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2,
  Type
} from '@angular/core';

import {
  SkyWindowRefService
} from '../window';

import {
  SkyDynamicComponentLocation
} from './dynamic-component-location';

import {
  SkyDynamicComponentOptions
} from './dynamic-component-options';

/**
 * Angular service for creating and rendering a dynamic component.
 */
@Injectable()
export class SkyDynamicComponentService {
  private renderer: Renderer2;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private applicationRef: ApplicationRef,
    private injector: Injector,
    private windowRef: SkyWindowRefService,
    rendererFactory: RendererFactory2
  ) {
    // Based on suggestions from https://github.com/angular/angular/issues/17824
    // for accessing an instance of Renderer2 in a service since Renderer2 can't
    // be injected into a service.  Passing undefined for both parameters results
    // in the default renderer which is what we want here.
    this.renderer = rendererFactory.createRenderer(undefined, undefined);
  }

  /**
   * Creates an instance of the specified component and adds it to the specified location
   * on the page.
   * @param options Options for creating the dynamic component.
   */
  public createComponent<T>(
    componentType: Type<T>,
    options?: SkyDynamicComponentOptions
  ): ComponentRef<T> {
    options = options || {
      location: SkyDynamicComponentLocation.BodyBottom
    };

    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory<T>(componentType)
      .create(this.injector);

    this.applicationRef.attachView(componentRef.hostView);

    const el = this.getRootNode(componentRef);

    const bodyEl = this.windowRef.getWindow().document.body;

    switch (options.location) {
      case SkyDynamicComponentLocation.BodyTop:
        this.renderer.insertBefore(bodyEl, el, bodyEl.firstChild);
        break;
      default:
        this.renderer.appendChild(bodyEl, el);
        break;
    }

    return componentRef;
  }

  /**
   * Removes a component ref from the page
   * @param componentRef Component ref for the component being removed
   */
  public removeComponent<T>(componentRef: ComponentRef<T>): void {
    if (!componentRef) {
      return;
    }

    this.applicationRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

  private getRootNode<T>(componentRef: ComponentRef<T>): any {
    // Technique for retrieving the component's root node taken from here:
    // https://malcoded.com/posts/angular-dynamic-components
    return (componentRef.hostView as EmbeddedViewRef<T>).rootNodes[0];
  }

}
